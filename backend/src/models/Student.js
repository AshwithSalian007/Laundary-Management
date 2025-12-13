import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide student name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    phone_number: {
      type: String,
      required: [true, 'Please provide phone number'],
      trim: true,
      match: [
        /^[6-9]\d{9}$/,
        'Please provide a valid Indian phone number (10 digits starting with 6-9)',
      ],
    },
    registration_number: {
      type: String,
      required: [true, 'Please provide registration number'],
      unique: true,
      trim: true,
    },
    gender: {
      type: String,
      required: [true, 'Please provide gender'],
      enum: {
        values: ['male', 'female'],
        message: 'Gender must be either male or female',
      },
    },
    batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Please assign student to a batch'],
    },

    // Hostel status field
    hostel_status: {
      type: String,
      enum: ['active', 'dropped', 'completed'],
      default: 'active',
      required: [true, 'Please provide hostel status'],
    },

    // Soft delete flag
    isDeleted: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
studentSchema.pre('save', async function (next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes for faster queries
studentSchema.index({ batch_id: 1, isDeleted: 1 });
studentSchema.index({ hostel_status: 1, isDeleted: 1 });
studentSchema.index({ isDeleted: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ registration_number: 1 });

// Query helper to exclude soft-deleted documents
studentSchema.query.notDeleted = function() {
  return this.where({ isDeleted: false });
};

// Ensure virtuals are included in JSON
studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

const Student = mongoose.model('Student', studentSchema);

export default Student;
