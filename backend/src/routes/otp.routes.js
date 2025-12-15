import express from 'express';
import {
  sendEmailVerificationOTP,
  sendPasswordResetOTP,
  resetPassword,
  verifyEmailOTP,
} from '../controllers/otp.controller.js';
import {
  otpRateLimiter,
  passwordResetRateLimiter,
  otpVerificationRateLimiter,
} from '../middleware/rateLimiter.middleware.js';
import { protect, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

// Email Verification for Students (Admin-initiated, requires authentication & permission)
// Admin creates student → sends OTP → verifies email
router.post(
  '/send-verification',
  protect,
  checkPermission('manage_students'),
  otpRateLimiter,
  sendEmailVerificationOTP
);
router.post(
  '/verify-email',
  protect,
  checkPermission('manage_students'),
  otpVerificationRateLimiter,
  verifyEmailOTP
);

// Password Reset (Public endpoints with rate limiting)
router.post('/send-reset-password', passwordResetRateLimiter, sendPasswordResetOTP);
router.post('/reset-password', otpVerificationRateLimiter, resetPassword);

export default router;
