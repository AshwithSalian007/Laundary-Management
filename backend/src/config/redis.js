import Redis from 'ioredis';

// Create Redis client with explicit configuration
// Using explicit host/port/password instead of URL for better compatibility
const redis = new Redis({
  host: "redis-11061.crce206.ap-south-1-1.ec2.cloud.redislabs.com",
  port: 11061,
  username: "default",
  password: "x0LCk83UCs64op5ZC9Q5K8uFxgZLOHEw",
  maxRetriesPerRequest: null, // Prevents app crash during connection issues
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

export default redis;
