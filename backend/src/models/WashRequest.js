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
      min: [0, 'Weight cannot be negative'],
    },
    cloth_count: {
      type: Number,
      default: 0,
      min: [0, 'Cloth count cannot be negative'],
    },
    wash_count: {
      type: Number,
      required: [true, 'Please provide wash count'],
      min: [0, 'Wash count cannot be negative'],
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
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate wash_count based on weight
washRequestSchema.pre('save', function(next) {
  if (this.isModified('weight_kg')) {
    // wash_count = CEIL(weight_kg / 7)
    this.wash_count = Math.ceil(this.weight_kg / 7);
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
washRequestSchema.index({ student_id: 1, status: 1 });
washRequestSchema.index({ plan_id: 1 });
washRequestSchema.index({ status: 1 });
washRequestSchema.index({ given_date: 1 });
washRequestSchema.index({ processed_by: 1 });

// Ensure virtuals are included in JSON
washRequestSchema.set('toJSON', { virtuals: true });
washRequestSchema.set('toObject', { virtuals: true });

const WashRequest = mongoose.model('WashRequest', washRequestSchema);

export default WashRequest;
