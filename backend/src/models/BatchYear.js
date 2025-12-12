import mongoose from 'mongoose';

const batchYearSchema = new mongoose.Schema(
  {
    batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Please provide batch'],
    },
    year_no: {
      type: Number,
      required: [true, 'Please provide year number'],
      min: [1, 'Year number must be at least 1'],
      max: [6, 'Year number cannot exceed 6'],
    },
    start_date: {
      type: Date,
      required: [true, 'Please provide academic year start date'],
    },
    end_date: {
      type: Date,
      required: [true, 'Please provide academic year end date'],
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
batchYearSchema.pre('save', function(next) {
  if (this.end_date <= this.start_date) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Compound index to ensure unique year_no per batch
batchYearSchema.index({ batch_id: 1, year_no: 1 }, { unique: true });
batchYearSchema.index({ isDeleted: 1 });

// Query helper to exclude soft-deleted documents
batchYearSchema.query.notDeleted = function() {
  return this.where({ isDeleted: false });
};

// Ensure virtuals are included in JSON
batchYearSchema.set('toJSON', { virtuals: true });
batchYearSchema.set('toObject', { virtuals: true });

const BatchYear = mongoose.model('BatchYear', batchYearSchema);

export default BatchYear;
