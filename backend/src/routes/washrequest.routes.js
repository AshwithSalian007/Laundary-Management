import express from 'express';
import {
  getMyWashRequests,
  createWashRequest,
  getWashRequestDetails,
} from '../controllers/washrequest.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Student routes - require authentication
router.use(protect);

// Get my wash requests
router.get('/my-requests', getMyWashRequests);

// Create new wash request
router.post('/', createWashRequest);

// Get wash request details
router.get('/:id', getWashRequestDetails);

export default router;
