import express from 'express';
import {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  restoreStudent,
  getStudentsWithoutWashPlan,
  createWashPlanForStudent,
} from '../controllers/student.controller.js';
import { protect, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication and manage_students permission
router.use(protect);
router.use(checkPermission('manage_students'));

// CRUD routes
router.get('/', getAllStudents);
router.get('/without-wash-plan', getStudentsWithoutWashPlan);
router.post('/', createStudent);
router.post('/:id/create-wash-plan', createWashPlanForStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.put('/:id/restore', restoreStudent);

export default router;
