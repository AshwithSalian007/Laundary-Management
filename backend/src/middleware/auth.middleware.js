import jwt from 'jsonwebtoken';
import { redisAuth } from '../config/redis.js';

// Protect routes - verify JWT and fetch permissions from Redis
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login to access this resource.',
      });
    }

    try {
      // Verify JWT token and extract data
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // decoded contains: { id, roleName }

      // Fetch permissions from Redis and reset TTL to 1 hour
      let permissions;
      try {
        permissions = await redisAuth.getAdminPermissions(decoded.id);
      } catch (redisError) {
        console.error('Redis error in auth middleware:', redisError.message);
        return res.status(503).json({
          success: false,
          message: 'Service temporarily unavailable. Please try again.',
        });
      }

      if (!permissions) {
        // Session expired or user logged out
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please login again.',
        });
      }

      // Attach user data to request object
      req.user = {
        id: decoded.id,
        roleName: decoded.roleName,
        permissions: permissions,
      };

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.',
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication',
      error: error.message,
    });
  }
};

// Check if admin has specific permission (using token permissions)
export const checkPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login first.',
      });
    }

    if (!req.user.permissions || !Array.isArray(req.user.permissions)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. No permissions assigned.',
      });
    }

    // Get permissions from token (req.user.permissions is already an array of permission names)
    const adminPermissions = req.user.permissions;

    // Check if admin has "all" permission (super admin)
    if (adminPermissions.includes('all')) {
      return next();
    }

    // Check if admin has any of the required permissions
    const hasPermission = requiredPermissions.some(permission =>
      adminPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permissions: ${requiredPermissions.join(' or ')}`,
      });
    }

    next();
  };
};

// Middleware to check if admin has "all" permission (Super Admin)
export const isSuperAdmin = checkPermission('all');

// Middleware to check if admin can manage staff
// Checks for 'manage_staff' permission, but 'all' permission bypasses (line 103)
export const canManageStaff = checkPermission('manage_staff');

// Middleware to check if admin can manage roles
// Checks for 'manage_roles' permission, but 'all' permission bypasses (line 103)
export const canManageRoles = checkPermission('manage_roles');

// Middleware to check if admin can manage departments
// Checks for 'manage_departments' permission, but 'all' permission bypasses (line 103)
export const canManageDepartments = checkPermission('manage_departments');
