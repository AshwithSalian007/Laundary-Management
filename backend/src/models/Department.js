import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide department name'],
      trim: true,
      unique: true,
    },
    duration_years: {
      type: Number,
      required: [true, 'Please provide course duration in years'],
      min: [1, 'Duration must be at least 1 year'],
      max: [6, 'Duration cannot exceed 6 years'],
    },

    // Soft delete flag
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
departmentSchema.index({ isDeleted: 1 });

// Query helper to exclude soft-deleted documents
departmentSchema.query.notDeleted = function() {
  return this.where({ isDeleted: false });
};

// Ensure virtuals are included in JSON
departmentSchema.set('toJSON', { virtuals: true });
departmentSchema.set('toObject', { virtuals: true });

const Department = mongoose.model('Department', departmentSchema);

export default Department;
