import express from 'express';
import {
  sendEmailVerificationOTP,
  sendPasswordResetOTP,
  resetPassword,
} from '../controllers/otp.controller.js';
import {
  otpRateLimiter,
  passwordResetRateLimiter,
  otpVerificationRateLimiter,
} from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// Email Verification (with rate limiting)
// Note: Email verification happens during student creation, not as a separate step
router.post('/send-verification', otpRateLimiter, sendEmailVerificationOTP);

// Password Reset (with stricter rate limiting)
router.post('/send-reset-password', passwordResetRateLimiter, sendPasswordResetOTP);
router.post('/reset-password', otpVerificationRateLimiter, resetPassword);

export default router;
