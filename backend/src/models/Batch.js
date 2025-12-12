import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Please provide department'],
    },
    batch_label: {
      type: String,
      required: [true, 'Please provide batch label'],
      trim: true,
      // Example: "2024-2028"
    },
    start_date: {
      type: Date,
      required: [true, 'Please provide batch start date'],
    },
    end_date: {
      type: Date,
      required: [true, 'Please provide batch end date'],
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
batchSchema.pre('save', function(next) {
  if (this.end_date <= this.start_date) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Index for faster queries
batchSchema.index({ department_id: 1, isDeleted: 1 });
batchSchema.index({ isDeleted: 1 });

// Query helper to exclude soft-deleted documents
batchSchema.query.notDeleted = function() {
  return this.where({ isDeleted: false });
};

// Ensure virtuals are included in JSON
batchSchema.set('toJSON', { virtuals: true });
batchSchema.set('toObject', { virtuals: true });

const Batch = mongoose.model('Batch', batchSchema);

export default Batch;
