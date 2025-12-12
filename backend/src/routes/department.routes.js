import express from 'express';
import {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  restoreDepartment,
} from '../controllers/department.controller.js';
import { protect, canManageDepartments } from '../middleware/auth.middleware.js';

const router = express.Router();

// All department routes require authentication and manage_departments permission
router.use(protect, canManageDepartments);

// Department CRUD routes
router.get('/', getAllDepartments);
router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);
router.put('/:id/restore', restoreDepartment);

export default router;
