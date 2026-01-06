import express from 'express';
import { getMyWashPlan } from '../controllers/washplan.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Student routes - require authentication
router.use(protect);

// Get my active wash plan
router.get('/my-plan', getMyWashPlan);

export default router;
