import mongoose from 'mongoose';

const yearSchema = new mongoose.Schema({
  year_no: {
    type: Number,
    required: [true, 'Please provide year number'],
    min: [1, 'Year number must be at least 1'],
    max: [6, 'Year number cannot exceed 6'],
  },
  start_date: {
    type: Date,
    required: false, // Optional - only Year 1 required on create
  },
  end_date: {
    type: Date,
    required: false, // Optional - only Year 1 required on create
  },
}, { _id: false }); // Disable _id for subdocuments

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
    current_year: {
      type: Number,
      required: [true, 'Please provide current year'],
      default: 1,
      min: [1, 'Current year must be at least 1'],
      max: [6, 'Current year cannot exceed 6'],
    },
    years: {
      type: [yearSchema],
      required: [true, 'Please provide years array'],
      validate: {
        validator: function(years) {
          return years && years.length > 0;
        },
        message: 'Years array must contain at least one year',
      },
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

// MEDIUM FIX #3: Combined pre-save validation for department-related checks
// (Combines years array length and current_year validation to avoid duplicate DB calls)
batchSchema.pre('save', async function(next) {
  // Check if we need to fetch department
  const needsDepartment =
    this.isModified('years') ||
    this.isModified('department_id') ||
    this.isModified('current_year');

  if (needsDepartment) {
    try {
      const Department = mongoose.model('Department');
      const department = await Department.findById(this.department_id);

      if (!department) {
        next(new Error('Department not found'));
        return;
      }

      // Validation 1: Years array length must match department duration
      if (this.isModified('years') || this.isModified('department_id')) {
        if (this.years.length !== department.duration_years) {
          next(new Error(`Years array length must match department duration (${department.duration_years} years)`));
          return;
        }
      }

      // Validation 2: Current year cannot exceed department duration
      if (this.isModified('current_year') || this.isModified('department_id')) {
        if (this.current_year > department.duration_years) {
          next(new Error(`Current year cannot exceed department duration (${department.duration_years} years)`));
          return;
        }
      }
    } catch (error) {
      next(error);
      return;
    }
  }
  next();
});

// Pre-save validation: Validate year_no sequence
batchSchema.pre('save', function(next) {
  if (this.isModified('years')) {
    const yearNumbers = this.years.map(y => y.year_no).sort((a, b) => a - b);

    // Check for duplicates
    const hasDuplicates = yearNumbers.some((num, index) => yearNumbers.indexOf(num) !== index);
    if (hasDuplicates) {
      next(new Error('Year numbers must be unique'));
      return;
    }

    // Check sequence starts from 1
    if (yearNumbers[0] !== 1) {
      next(new Error('Year numbers must start from 1'));
      return;
    }

    // Check for gaps in sequence
    for (let i = 0; i < yearNumbers.length; i++) {
      if (yearNumbers[i] !== i + 1) {
        next(new Error('Year numbers must be sequential (1, 2, 3, ...)'));
        return;
      }
    }
  }
  next();
});

// Pre-save validation: Validate date ranges
batchSchema.pre('save', function(next) {
  if (this.isModified('years')) {
    for (const year of this.years) {
      // Only validate if both dates are provided
      if (year.start_date && year.end_date) {
        // Check end_date > start_date for each year
        if (year.end_date <= year.start_date) {
          next(new Error(`Year ${year.year_no}: End date must be after start date`));
          return;
        }
      }
      // If only one date is provided, that's an error
      else if (year.start_date || year.end_date) {
        next(new Error(`Year ${year.year_no}: Both start date and end date must be provided together`));
        return;
      }
    }

    // LOW FIX #7: Check for overlapping date ranges (ALL years with dates, not just consecutive)
    // This prevents Year 1 and Year 3 from overlapping even if Year 2 has null dates
    const yearsWithDates = this.years
      .filter(y => y.start_date && y.end_date)
      .sort((a, b) => a.year_no - b.year_no);

    // Check each pair of years with dates
    for (let i = 0; i < yearsWithDates.length - 1; i++) {
      for (let j = i + 1; j < yearsWithDates.length; j++) {
        const yearA = yearsWithDates[i];
        const yearB = yearsWithDates[j];

        // Check if dates overlap or don't have minimum 1 day gap
        if (yearA.end_date >= yearB.start_date) {
          next(new Error(
            `Year ${yearA.year_no} and Year ${yearB.year_no} have overlapping dates. ` +
            `Year ${yearA.year_no} ends on ${yearA.end_date.toISOString().split('T')[0]} ` +
            `but Year ${yearB.year_no} starts on ${yearB.start_date.toISOString().split('T')[0]}. ` +
            `Minimum 1 day gap required.`
          ));
          return;
        }
      }
    }
  }
  next();
});

// Index for faster queries
batchSchema.index({ department_id: 1, isDeleted: 1 });
batchSchema.index({ isDeleted: 1 });
batchSchema.index({ current_year: 1 });

// MEDIUM FIX #4: Compound unique index for batch_label per department
// Ensures database-level uniqueness for active batches
batchSchema.index(
  { department_id: 1, batch_label: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
    name: 'unique_batch_label_per_department'
  }
);

// Query helper to exclude soft-deleted documents
batchSchema.query.notDeleted = function() {
  return this.where({ isDeleted: false });
};

// Ensure virtuals are included in JSON
batchSchema.set('toJSON', { virtuals: true });
batchSchema.set('toObject', { virtuals: true });

const Batch = mongoose.model('Batch', batchSchema);

export default Batch;
