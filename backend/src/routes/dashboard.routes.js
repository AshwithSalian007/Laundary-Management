import express from 'express';
import { getDashboardStats, getRecentRequests } from '../controllers/dashboard.controller.js';
import { protect, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication AND admin access (not students)
router.use(protect, isAdmin);

// Dashboard statistics
router.get('/stats', getDashboardStats);

// Recent wash requests for activity feed
router.get('/recent-requests', getRecentRequests);

export default router;
