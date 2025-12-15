import express from 'express';
import {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  restoreStudent,
} from '../controllers/student.controller.js';
import { protect, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication and manage_students permission
router.use(protect);
router.use(checkPermission('manage_students'));

// CRUD routes
router.get('/', getAllStudents);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.put('/:id/restore', restoreStudent);

export default router;
