import mongoose from 'mongoose';

const washRequestSchema = new mongoose.Schema(
  {
    plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'YearlyWashPlan',
      required: [true, 'Please provide yearly wash plan'],
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Please provide student'],
    },
    weight_kg: {
      type: Number,
      required: [true, 'Please provide laundry weight'],
      min: [0.1, 'Weight must be at least 0.1 kg'],
    },
    cloth_count: {
      type: Number,
      default: 0,
      min: [0, 'Cloth count cannot be negative'],
    },
    wash_count: {
      type: Number,
      required: [true, 'Please provide wash count'],
      min: [1, 'Wash count must be at least 1'],
    },
    status: {
      type: String,
      enum: ['pickup_pending', 'picked_up', 'washing', 'completed', 'returned', 'cancelled'],
      default: 'pickup_pending',
    },
    given_date: {
      type: Date,
      required: [true, 'Please provide given date'],
      default: Date.now,
    },
    returned_date: {
      type: Date,
    },
    processed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Please provide staff who processed this'],
    },
    notes: {
      type: String,
      trim: true,
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

// Pre-save hook to calculate wash_count based on weight and plan's maxWeightPerWash
washRequestSchema.pre('save', async function(next) {
  if (this.isModified('weight_kg') || this.isModified('plan_id')) {
    try {
      // Fetch the yearly wash plan to get maxWeightPerWash
      const YearlyWashPlan = mongoose.model('YearlyWashPlan');
      const plan = await YearlyWashPlan.findById(this.plan_id);

      if (!plan) {
        return next(new Error('Yearly wash plan not found'));
      }

      // wash_count = CEIL(weight_kg / max_weight_per_wash)
      this.wash_count = Math.ceil(this.weight_kg / plan.max_weight_per_wash);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Validation: returned_date must be after given_date (if provided)
washRequestSchema.pre('save', function(next) {
  if (this.returned_date && this.returned_date <= this.given_date) {
    next(new Error('Returned date must be after given date'));
  }
  next();
});

// Indexes for faster queries
washRequestSchema.index({ student_id: 1, status: 1, isDeleted: 1 });
washRequestSchema.index({ plan_id: 1, isDeleted: 1 });
washRequestSchema.index({ status: 1, isDeleted: 1 });
washRequestSchema.index({ given_date: 1 });
washRequestSchema.index({ processed_by: 1 });
washRequestSchema.index({ isDeleted: 1 });

// Query helper to exclude soft-deleted documents
washRequestSchema.query.notDeleted = function() {
  return this.where({ isDeleted: false });
};

// Ensure virtuals are included in JSON
washRequestSchema.set('toJSON', { virtuals: true });
washRequestSchema.set('toObject', { virtuals: true });

const WashRequest = mongoose.model('WashRequest', washRequestSchema);

export default WashRequest;
