import OTP from '../models/OTP.js';
import Student from '../models/Student.js';
import { sendOTPEmail, sendWelcomeEmail } from '../services/email.service.js';
import {
  isValidEmail,
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
 * @desc    Send OTP for email verification (for newly created student)
 * @route   POST /api/otp/send-verification
 * @access  Private (Admin only - requires 'all' or 'manage_students' permission)
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

    // Check if student exists with this email (exclude soft-deleted students)
    const existingStudent = await Student.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'No student found with this email',
      });
    }

    // Check if email is already verified
    if (existingStudent.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'This email is already verified',
      });
    }

    // Invalidate previous OTPs for this email and type
    await OTP.deleteMany({
      user_email: email.toLowerCase(),
      otp_type: 'email_verification',
    });

    // Generate new OTP
    const otpCode = generateOTPCode();
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes

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

    // Check if student exists (exclude soft-deleted students)
    const student = await Student.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });
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
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes

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

    // Find student first (exclude soft-deleted students)
    const student = await Student.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Update student password
    student.password = new_password;
    await student.save();

    // Delete OTP only after successful password update
    await OTP.deleteOne({ _id: otpRecord._id });

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

/**
 * @desc    Verify email with OTP (for newly created students)
 * @route   POST /api/otp/verify-email
 * @access  Private (Admin only - requires 'all' or 'manage_students' permission)
 */
export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP',
      });
    }

    // Find student with this email (exclude soft-deleted students)
    const student = await Student.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Check if email is already verified
    if (student.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
      user_email: email.toLowerCase(),
      otp_type: 'email_verification',
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

    // OTP is valid - Update student email verification status
    student.email_verified = true;
    student.email_verified_at = new Date();
    await student.save();

    // Delete OTP after successful verification
    await OTP.deleteOne({ _id: otpRecord._id });

    // Send welcome email with password
    // Password is passed from frontend (captured during student creation)
    let emailWarning = null;
    try {
      const emailResult = await sendWelcomeEmail(email.toLowerCase(), student.name, password);
      if (!emailResult.success) {
        emailWarning = 'Email verified, but failed to send welcome email. Please notify the student manually.';
        console.error('Welcome email failed:', emailResult.error);
      }
    } catch (emailError) {
      emailWarning = 'Email verified, but failed to send welcome email. Please notify the student manually.';
      console.error('Welcome email error:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      warning: emailWarning,
      data: {
        email: student.email,
        email_verified: student.email_verified,
        email_verified_at: student.email_verified_at,
      },
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message,
    });
  }
};
