import OTP from '../models/OTP.js';
import Student from '../models/Student.js';
import { sendOTPEmail } from '../services/email.service.js';
import {
  isValidEmail,
  sanitizeEmail,
  validatePassword,
  PASSWORD_CONSTRAINTS,
} from '../utils/validation.js';

/**
 * Generate 6-digit OTP
 */
const generateOTPCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Send OTP for email verification (for new student creation)
 * @route   POST /api/otp/send-verification
 * @access  Public
 */
export const sendEmailVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email',
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Check if email already exists (for new student creation, email should NOT exist)
    const existingStudent = await Student.findOne({ email: email.toLowerCase() });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'A student with this email already exists',
      });
    }

    // Invalidate previous OTPs for this email and type
    await OTP.deleteMany({
      user_email: email.toLowerCase(),
      otp_type: 'email_verification',
    });

    // Generate new OTP
    const otpCode = generateOTPCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    const otp = await OTP.create({
      user_email: email.toLowerCase(),
      user_type: 'student',
      otp_code: otpCode,
      otp_type: 'email_verification',
      expires_at: expiresAt,
    });

    // Send OTP via email
    try {
      await sendOTPEmail(email.toLowerCase(), otpCode, 'verification');
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Delete the OTP since we couldn't send the email
      await OTP.deleteOne({ _id: otp._id });
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please check the email address.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to email successfully',
      // For development only - remove in production
      dev_otp: process.env.NODE_ENV === 'development' ? otpCode : undefined,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message,
    });
  }
};

/**
 * @desc    Send OTP for password reset
 * @route   POST /api/otp/send-reset-password
 * @access  Public
 */
export const sendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email',
      });
    }

    // Check if student exists
    const student = await Student.findOne({ email: email.toLowerCase() });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email',
      });
    }

    // Invalidate previous OTPs for this email and type
    await OTP.deleteMany({
      user_email: email.toLowerCase(),
      otp_type: 'password_reset',
    });

    // Generate new OTP
    const otpCode = generateOTPCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    const otpRecord = await OTP.create({
      user_email: email.toLowerCase(),
      user_type: 'student',
      otp_code: otpCode,
      otp_type: 'password_reset',
      expires_at: expiresAt,
    });

    // Send OTP via email
    try {
      await sendOTPEmail(email.toLowerCase(), otpCode, 'password_reset');
    } catch (emailError) {
      console.error('Failed to send password reset OTP email:', emailError);
      // Delete the OTP since we couldn't send the email
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please check the email address.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email',
      // For development only - remove in production
      dev_otp: process.env.NODE_ENV === 'development' ? otpCode : undefined,
    });
  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset OTP',
      error: error.message,
    });
  }
};

/**
 * @desc    Verify OTP and reset password
 * @route   POST /api/otp/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;

    if (!email || !otp || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, OTP, and new password',
      });
    }

    // Validate password
    const passwordValidation = validatePassword(new_password, PASSWORD_CONSTRAINTS.MIN_LENGTH);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
      user_email: email.toLowerCase(),
      otp_type: 'password_reset',
      is_used: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found or OTP has expired',
      });
    }

    // Check if OTP expired
    if (new Date() > otpRecord.expires_at) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one',
      });
    }

    // Check attempts limit
    if (otpRecord.attempts >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP',
      });
    }

    // Verify OTP
    const isValid = await otpRecord.verifyOTP(otp);

    if (!isValid) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining`,
      });
    }

    // Delete OTP immediately after successful verification (cleanup)
    await OTP.deleteOne({ _id: otpRecord._id });

    // Update student password
    const student = await Student.findOne({ email: email.toLowerCase() });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    student.password = new_password;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message,
    });
  }
};
