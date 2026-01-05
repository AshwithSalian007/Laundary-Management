import express from 'express';
import {
  getAllWashPolicies,
  createWashPolicy,
  updateWashPolicy,
  deleteWashPolicy,
  restoreWashPolicy,
} from '../controllers/washpolicy.controller.js';
import { protect, canManagePolicies } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication and permission check to all routes
router.use(protect, canManagePolicies);

// Wash policy routes
router.get('/', getAllWashPolicies);
router.post('/', createWashPolicy);
router.put('/:id', updateWashPolicy);
router.delete('/:id', deleteWashPolicy);
router.put('/:id/restore', restoreWashPolicy);

export default router;
