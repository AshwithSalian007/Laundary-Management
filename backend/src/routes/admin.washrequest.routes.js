import express from 'express';
import {
  getAllWashRequests,
  getWashRequestById,
  updateWashRequestWeight,
  updateWashRequestStatus,
  getWashRequestStats,
  deleteWashRequest,
} from '../controllers/admin.washrequest.controller.js';
import { protect, canProcessWash } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication and process_wash permission
router.use(protect, canProcessWash);

// Statistics endpoint
router.get('/stats', getWashRequestStats);

// CRUD operations
router.get('/', getAllWashRequests);
router.get('/:id', getWashRequestById);

// Weight management
router.put('/:id/weight', updateWashRequestWeight);

// Status management
router.put('/:id/status', updateWashRequestStatus);

// Delete
router.delete('/:id', deleteWashRequest);

export default router;
