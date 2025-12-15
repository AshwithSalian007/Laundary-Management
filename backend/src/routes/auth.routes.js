import express from 'express';
import {
  login,
  studentLogin,
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
import { protect, isSuperAdmin, canManageStaff, canManageRoles, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/login', login); // Admin login
router.post('/student/login', studentLogin); // Student login

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// Staff Management routes - require 'all' OR 'manage_staff' permission
router.post('/staff', protect, canManageStaff, createStaff);
router.get('/staff', protect, canManageStaff, getAllStaff);
router.put('/staff/:id/role', protect, canManageStaff, updateStaffRole);
router.delete('/staff/:id', protect, canManageStaff, deleteStaff);

// Role Management routes - require 'all' OR 'manage_roles' permission
router.post('/roles', protect, canManageRoles, createRole);
// GET roles: Allow 'manage_staff' (to view roles when assigning to staff) AND 'manage_roles' (to manage roles)
router.get('/roles', protect, checkPermission('manage_staff', 'manage_roles'), getAllRoles);
router.put('/roles/:id', protect, canManageRoles, updateRolePermissions);
router.delete('/roles/:id', protect, canManageRoles, deleteRole);

// Permissions routes
// GET permissions: Allow 'manage_roles' (to view permissions when assigning to roles) AND 'all' (super admin)
router.get('/permissions', protect, checkPermission('all', 'manage_roles'), getAllPermissions);

export default router;
