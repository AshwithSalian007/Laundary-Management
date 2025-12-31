import mongoose from 'mongoose';

const yearlyWashPlanSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Please provide student'],
    },
    batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Please provide batch'],
    },
    year_no: {
      type: Number,
      required: [true, 'Please provide year number'],
      min: [1, 'Year must be at least 1'],
      max: [6, 'Year cannot exceed 6'],
    },

    // Policy reference - the policy that was active when this plan was created
    policy_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WashPolicy',
      required: [true, 'Please provide wash policy'],
    },

    // Frozen policy values - copied from policy at creation time and never changed
    total_washes: {
      type: Number,
      required: [true, 'Please provide total washes'],
      min: [0, 'Total washes cannot be negative'],
    },
    max_weight_per_wash: {
      type: Number,
      required: [true, 'Please provide maximum weight per wash'],
      min: [0.1, 'Maximum weight per wash must be at least 0.1 kg'],
      // Copied from policy at creation - used for wash_count calculation
    },

    // Dynamic counters
    used_washes: {
      type: Number,
      required: [true, 'Please provide used washes'],
      default: 0,
      min: [0, 'Used washes cannot be negative'],
    },
    remaining_washes: {
      type: Number,
      required: [true, 'Please provide remaining washes'],
      min: [0, 'Remaining washes cannot be negative'],
    },

    // Date range - endDate is NULL until batch promotion
    start_date: {
      type: Date,
      required: [true, 'Please provide plan start date'],
    },
    end_date: {
      type: Date,
      required: false,
      default: null,
      // NULL = plan is ongoing
      // Set when batch is promoted to next year
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

// Validation: end_date must be after start_date (if provided)
yearlyWashPlanSchema.pre('save', function(next) {
  // Only validate if end_date is provided (not null)
  if (this.end_date && this.end_date <= this.start_date) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Validation: remaining_washes should equal total_washes - used_washes
yearlyWashPlanSchema.pre('save', function(next) {
  this.remaining_washes = this.total_washes - this.used_washes;
  next();
});

// Compound index to ensure unique plan per student per year per batch
yearlyWashPlanSchema.index({ student_id: 1, batch_id: 1, year_no: 1 }, { unique: true });
yearlyWashPlanSchema.index({ student_id: 1, is_active: 1, isDeleted: 1 });
yearlyWashPlanSchema.index({ batch_id: 1, year_no: 1, isDeleted: 1 });
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
