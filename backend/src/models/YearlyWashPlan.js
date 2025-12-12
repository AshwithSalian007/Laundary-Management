import mongoose from 'mongoose';

const yearlyWashPlanSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Please provide student'],
    },
    batch_year_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BatchYear',
      required: [true, 'Please provide batch year'],
    },
    year_no: {
      type: Number,
      required: [true, 'Please provide year number'],
      min: [1, 'Year must be at least 1'],
      max: [6, 'Year cannot exceed 6'],
    },
    total_washes: {
      type: Number,
      required: [true, 'Please provide total washes'],
      default: 30,
      min: [0, 'Total washes cannot be negative'],
    },
    used_washes: {
      type: Number,
      required: [true, 'Please provide used washes'],
      default: 0,
      min: [0, 'Used washes cannot be negative'],
    },
    remaining_washes: {
      type: Number,
      required: [true, 'Please provide remaining washes'],
      default: 30,
      min: [0, 'Remaining washes cannot be negative'],
    },
    start_date: {
      type: Date,
      required: [true, 'Please provide plan start date'],
    },
    end_date: {
      type: Date,
      required: [true, 'Please provide plan end date'],
    },
    is_active: {
      type: Boolean,
      default: true,
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

// Validation: end_date must be after start_date
yearlyWashPlanSchema.pre('save', function(next) {
  if (this.end_date <= this.start_date) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Validation: remaining_washes should equal total_washes - used_washes
yearlyWashPlanSchema.pre('save', function(next) {
  this.remaining_washes = this.total_washes - this.used_washes;
  next();
});

// Compound index to ensure unique plan per student per year
yearlyWashPlanSchema.index({ student_id: 1, batch_year_id: 1 }, { unique: true });
yearlyWashPlanSchema.index({ student_id: 1, is_active: 1, isDeleted: 1 });
yearlyWashPlanSchema.index({ isDeleted: 1 });

// Query helper to exclude soft-deleted documents
yearlyWashPlanSchema.query.notDeleted = function() {
  return this.where({ isDeleted: false });
};

// Ensure virtuals are included in JSON
yearlyWashPlanSchema.set('toJSON', { virtuals: true });
yearlyWashPlanSchema.set('toObject', { virtuals: true });

const YearlyWashPlan = mongoose.model('YearlyWashPlan', yearlyWashPlanSchema);

export default YearlyWashPlan;
