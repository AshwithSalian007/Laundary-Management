import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const otpSchema = new mongoose.Schema(
  {
    user_email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    user_type: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    otp_code: {
      type: String,
      required: [true, 'OTP code is required'],
    },
    otp_type: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      required: [true, 'OTP type is required'],
    },
    expires_at: {
      type: Date,
      required: [true, 'Expiry time is required'],
      index: { expires: 0 }, // TTL index - auto-delete expired documents
    },
    is_used: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      max: [5, 'Maximum verification attempts exceeded'],
    },
  },
  {
    timestamps: true,
  }
);

// Hash OTP before saving
otpSchema.pre('save', async function(next) {
  if (!this.isModified('otp_code')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.otp_code = await bcrypt.hash(this.otp_code, salt);
  next();
});

// Method to verify OTP
otpSchema.methods.verifyOTP = async function(candidateOTP) {
  return await bcrypt.compare(candidateOTP, this.otp_code);
};

// Index for faster queries
otpSchema.index({ user_email: 1, otp_type: 1 });
otpSchema.index({ expires_at: 1 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
