import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

// Create Redis client with explicit configuration
const redis = new Redis({
  host: "redis-14029.c265.us-east-1-2.ec2.cloud.redislabs.com",
  port: 14029,
  username: "default",
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, 
  enableReadyCheck: false,
  connectTimeout: 10000, // 10 seconds
  retryStrategy(times) {
    if (times > 10) {
      console.warn('⚠ Redis retry limit reached, will keep trying in background...');
      return 5000; // Wait 5 seconds between retries after 10 attempts
    }
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
  // Note: TLS removed - this Redis instance doesn't use TLS on this port
});

// Redis connection events
redis.on('connect', () => {
  console.log('✓ Redis connecting...');
});

redis.on('ready', () => {
  console.log('✓ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('✗ Redis connection error:', err.message || err);
  if (err.code) {
    console.error('  Error code:', err.code);
  }
  if (err.syscall) {
    console.error('  System call:', err.syscall);
  }
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});

// Redis utility functions for admin authentication
export const redisAuth = {
  // Store admin permissions in Redis with 1 hour TTL
  async setAdminPermissions(adminId, permissions) {
    const key = `admin-auth:${adminId}`;
    const value = JSON.stringify(permissions);
    await redis.setex(key, 3600, value); // 3600 seconds = 1 hour
  },

  // Get admin permissions and reset TTL to 1 hour
  async getAdminPermissions(adminId) {
    const key = `admin-auth:${adminId}`;
    const value = await redis.get(key);

    if (!value) {
      return null; // Session expired or user logged out
    }

    // Reset TTL to 1 hour (keep-alive)
    await redis.expire(key, 3600);

    return JSON.parse(value);
  },

  // Delete admin session (logout)
  async deleteAdminSession(adminId) {
    const key = `admin-auth:${adminId}`;
    await redis.del(key);
  },

  // Update admin permissions while preserving remaining TTL
  // Only updates if session exists (staff is logged in)
  async updateAdminPermissionsPreserveTTL(adminId, permissions) {
    const key = `admin-auth:${adminId}`;

    // Check if session exists and get remaining TTL
    const ttl = await redis.ttl(key);

    // ttl returns -2 if key doesn't exist, -1 if key exists but has no expiry
    if (ttl <= 0) {
      // Session doesn't exist or expired - no need to update Redis
      return false;
    }

    // Update permissions while preserving the remaining TTL
    const value = JSON.stringify(permissions);
    await redis.setex(key, ttl, value);

    return true; // Successfully updated
  },

  // Update permissions for multiple admins while preserving their individual TTLs
  // Uses Lua script for atomic batch update
  async updateMultipleAdminPermissionsPreserveTTL(adminIds, permissions) {
    if (adminIds.length === 0) return 0;

    const value = JSON.stringify(permissions);

    // Lua script to update only existing keys while preserving their TTL
    const luaScript = `
      local updated = 0
      for i, key in ipairs(KEYS) do
        local ttl = redis.call('ttl', key)
        if ttl > 0 then
          redis.call('setex', key, ttl, ARGV[1])
          updated = updated + 1
        end
      end
      return updated
    `;

    const keys = adminIds.map(id => `admin-auth:${id}`);

    try {
      const updatedCount = await redis.eval(luaScript, keys.length, ...keys, value);
      return updatedCount;
    } catch (error) {
      console.error('Error updating multiple admin permissions (preserve TTL):', error.message);
      throw error;
    }
  }
};

// Redis utility functions for student authentication
export const redisStudent = {
  // Store student session in Redis (no TTL - lives forever until logout)
  async setStudentSession(studentId, sessionData) {
    const key = `student:session:${studentId}`;
    const value = JSON.stringify({
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      ...sessionData
    });
    await redis.set(key, value); // No expiry
  },

  // Get student session
  async getStudentSession(studentId) {
    const key = `student:session:${studentId}`;
    const value = await redis.get(key);

    if (!value) {
      return null; // Session doesn't exist (logged out)
    }

    return JSON.parse(value);
  },

  // Update last activity timestamp
  async updateStudentActivity(studentId) {
    const key = `student:session:${studentId}`;
    const session = await this.getStudentSession(studentId);

    if (session) {
      session.lastActivity = new Date().toISOString();
      await redis.set(key, JSON.stringify(session));
    }
  },

  // Delete student session (logout)
  async deleteStudentSession(studentId) {
    const key = `student:session:${studentId}`;
    await redis.del(key);
  },

  // Get all active student sessions (for admin dashboard - future feature)
  async getAllActiveStudents() {
    const keys = await redis.keys('student:session:*');
    const sessions = [];

    for (const key of keys) {
      const studentId = key.replace('student:session:', '');
      const sessionData = await redis.get(key);

      if (sessionData) {
        sessions.push({
          studentId,
          ...JSON.parse(sessionData)
        });
      }
    }

    return sessions;
  }
};

export default redis;
