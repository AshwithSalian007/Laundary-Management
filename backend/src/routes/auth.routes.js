import express from 'express';
import {
  login,
  createStaff,
  getMe,
  logout,
  getAllRoles,
  getAllPermissions,
  getAllStaff,
  updateStaffRole,
  deleteStaff,
  createRole,
  updateRolePermissions,
  deleteRole,
} from '../controllers/auth.controller.js';
import { protect, isSuperAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// Super Admin only routes - Staff Management
router.post('/staff', protect, isSuperAdmin, createStaff);
router.get('/staff', protect, isSuperAdmin, getAllStaff);
router.put('/staff/:id/role', protect, isSuperAdmin, updateStaffRole);
router.delete('/staff/:id', protect, isSuperAdmin, deleteStaff);

// Super Admin only routes - Role Management
router.post('/roles', protect, isSuperAdmin, createRole);
router.get('/roles', protect, isSuperAdmin, getAllRoles);
router.put('/roles/:id', protect, isSuperAdmin, updateRolePermissions);
router.delete('/roles/:id', protect, isSuperAdmin, deleteRole);

// Super Admin only routes - Permissions
router.get('/permissions', protect, isSuperAdmin, getAllPermissions);

export default router;
