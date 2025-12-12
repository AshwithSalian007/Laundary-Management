import dotenv from 'dotenv';

// Load environment variables FIRST before other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import redis from './config/redis.js';
import authRoutes from './routes/auth.routes.js';
import departmentRoutes from './routes/department.routes.js';
import { initializeAdmin } from './scripts/initializeAdmin.js';

// Create Express app
const app = express();

// Connect to MongoDB and initialize admin system
connectDB()
  .then(async () => {
    console.log('✓ MongoDB connected');

    // Try Redis connection but don't fail if it's not available
    try {
      await redis.ping();
      console.log('✓ Redis health check passed');
    } catch (error) {
      console.warn('⚠ Redis connection failed, continuing without Redis. Session management may not work properly.');
      console.warn('  Error:', error.message);
    }

    // Initialize default admin, roles, and permissions
    await initializeAdmin();
    console.log('✓ Admin system initialized');
  })
  .catch((error) => {
    console.error('✗ Failed to initialize:', error);
    process.exit(1);
  });

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.CLIENT_URL
    ].filter(Boolean);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// Mount more specific routes first
app.use('/api/admin/departments', departmentRoutes);
app.use('/api/admin', authRoutes);

// Health check route (includes Redis status)
app.get('/health', async (req, res) => {
  try {
    // Check Redis connectivity
    const redisStatus = await redis.ping();
    const isRedisHealthy = redisStatus === 'PONG';

    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        redis: isRedisHealthy ? 'healthy' : 'unhealthy',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service unavailable',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        redis: 'unhealthy',
      },
      error: error.message,
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SmartWash API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      admin: '/api/admin',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`SmartWash API Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await redis.quit();
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    await redis.quit();
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});
