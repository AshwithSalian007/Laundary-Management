import express from 'express';
import {
  getAllBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  restoreBatch,
  promoteBatch,
} from '../controllers/batch.controller.js';
import { protect, canManageBatches } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication and permission check to all routes
router.use(protect, canManageBatches);

// Batch routes
router.get('/', getAllBatches);
router.post('/', createBatch);
router.put('/:id', updateBatch);
router.delete('/:id', deleteBatch);
router.put('/:id/restore', restoreBatch);
router.post('/:id/promote', promoteBatch);

export default router;
