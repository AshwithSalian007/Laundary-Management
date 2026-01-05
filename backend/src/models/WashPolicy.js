import mongoose from 'mongoose';

const washPolicySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide policy name'],
      trim: true,
      // Example: "Default Yearly Policy", "2025-2026 Policy"
    },
    total_washes: {
      type: Number,
      required: [true, 'Please provide total washes'],
      min: [0, 'Total washes cannot be negative'],
      default: 30,
    },
    max_weight_per_wash: {
      type: Number,
      required: [true, 'Please provide maximum weight per wash'],
      min: [0.1, 'Maximum weight per wash must be at least 0.1 kg'],
      default: 7,
      // In kg - used for wash_count calculation
    },
    is_active: {
      type: Boolean,
      default: false,
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
washPolicySchema.index({ is_active: 1, isDeleted: 1 });
washPolicySchema.index({ isDeleted: 1 });

// Query helper to exclude soft-deleted documents
washPolicySchema.query.notDeleted = function() {
  return this.where({ isDeleted: false });
};

// Ensure virtuals are included in JSON
washPolicySchema.set('toJSON', { virtuals: true });
washPolicySchema.set('toObject', { virtuals: true });

const WashPolicy = mongoose.model('WashPolicy', washPolicySchema);

export default WashPolicy;
