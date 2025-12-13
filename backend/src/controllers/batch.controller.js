import Batch from '../models/Batch.js';
import Department from '../models/Department.js';

/**
 * @desc    Get all batches (active and optionally deleted)
 * @route   GET /api/admin/batches
 * @access  Private (requires 'all' or 'manage_batches' permission)
 */
export const getAllBatches = async (req, res) => {
  try {
    const { includeDeleted } = req.query;

    let query = {};
    if (includeDeleted !== 'true') {
      query.isDeleted = false;
    }

    const batches = await Batch.find(query)
      .populate({
        path: 'department_id',
        select: 'name duration_years isDeleted'
      })
      .sort({ createdAt: -1 });

    // MEDIUM FIX #6: Filter out batches with deleted departments
    // This prevents displaying orphaned batches in the UI
    const activeBatches = batches.filter(
      batch => batch.department_id && !batch.department_id.isDeleted
    );

    res.status(200).json({
      success: true,
      count: activeBatches.length,
      data: activeBatches,
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch batches',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new batch
 * @route   POST /api/admin/batches
 * @access  Private (requires 'all' or 'manage_batches' permission)
 */
export const createBatch = async (req, res) => {
  try {
    const {
      department_id,
      start_year,
      end_year,
      year_1_start_date,
      year_1_end_date
    } = req.body;

    // Validation: Check required fields
    if (!department_id || !start_year || !end_year || !year_1_start_date || !year_1_end_date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: department, start year, end year, and year 1 dates',
      });
    }

    // Validate year inputs
    const startYearNum = Number(start_year);
    const endYearNum = Number(end_year);

    if (isNaN(startYearNum) || isNaN(endYearNum)) {
      return res.status(400).json({
        success: false,
        message: 'Start year and end year must be valid numbers',
      });
    }

    if (startYearNum < 2000 || startYearNum > 2100 || endYearNum < 2000 || endYearNum > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Years must be between 2000 and 2100',
      });
    }

    // Validate start year is before end year
    if (startYearNum >= endYearNum) {
      return res.status(400).json({
        success: false,
        message: 'End year must be after start year',
      });
    }

    // Validate year 1 dates
    const year1Start = new Date(year_1_start_date);
    const year1End = new Date(year_1_end_date);

    if (isNaN(year1Start.getTime()) || isNaN(year1End.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format for year 1 dates',
      });
    }

    if (year1End <= year1Start) {
      return res.status(400).json({
        success: false,
        message: 'Year 1 end date must be after start date',
      });
    }

    // Fetch department to get duration
    const department = await Department.findOne({
      _id: department_id,
      isDeleted: false
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found or has been deleted',
      });
    }

    // Validate that year range matches department duration
    const calculatedDuration = endYearNum - startYearNum;
    if (calculatedDuration !== department.duration_years) {
      return res.status(400).json({
        success: false,
        message: `Year range (${calculatedDuration} years) does not match department duration (${department.duration_years} years)`,
      });
    }

    // Generate batch label
    const batch_label = `${start_year}-${end_year}`;

    // Check for duplicate batch label in same department
    const existingBatch = await Batch.findOne({
      department_id,
      batch_label,
      isDeleted: false
    });

    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: `A batch with label "${batch_label}" already exists for this department`,
      });
    }

    // Generate years array
    const years = [];

    // Year 1: Use provided dates
    years.push({
      year_no: 1,
      start_date: year1Start,
      end_date: year1End
    });

    // Years 2-N: Auto-generate with null dates
    for (let i = 2; i <= department.duration_years; i++) {
      years.push({
        year_no: i,
        start_date: null,
        end_date: null
      });
    }

    // Create batch
    const batch = await Batch.create({
      department_id,
      batch_label,
      current_year: 1,
      years
    });

    // MEDIUM FIX #5: Use already-fetched department instead of re-populating
    // This avoids potential inconsistency if department is deleted between save and populate
    const batchResponse = {
      ...batch.toObject(),
      department_id: {
        _id: department._id,
        name: department.name,
        duration_years: department.duration_years
      }
    };

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: batchResponse,
    });
  } catch (error) {
    console.error('Error creating batch:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation error',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create batch',
      error: error.message,
    });
  }
};

/**
 * @desc    Update batch
 * @route   PUT /api/admin/batches/:id
 * @access  Private (requires 'all' or 'manage_batches' permission)
 */
export const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { years } = req.body;

    // Find batch
    const batch = await Batch.findOne({ _id: id, isDeleted: false });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found or has been deleted',
      });
    }

    // Validation: Only allow updating years array
    if (!years || !Array.isArray(years)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide years array',
      });
    }

    // Validate years array length matches original
    if (years.length !== batch.years.length) {
      return res.status(400).json({
        success: false,
        message: `Years array must contain exactly ${batch.years.length} years`,
      });
    }

    // Validate each year
    for (let i = 0; i < years.length; i++) {
      const year = years[i];

      // Check year_no matches position
      if (year.year_no !== i + 1) {
        return res.status(400).json({
          success: false,
          message: `Year at position ${i + 1} must have year_no ${i + 1}`,
        });
      }

      // Check if both dates are provided together (CRITICAL FIX #1)
      if ((year.start_date && !year.end_date) || (!year.start_date && year.end_date)) {
        return res.status(400).json({
          success: false,
          message: `Year ${year.year_no}: Both start date and end date must be provided together`,
        });
      }

      // If dates are provided, validate them
      if (year.start_date && year.end_date) {
        const startDate = new Date(year.start_date);
        const endDate = new Date(year.end_date);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: `Invalid date format for year ${year.year_no}`,
          });
        }

        if (endDate <= startDate) {
          return res.status(400).json({
            success: false,
            message: `Year ${year.year_no}: End date must be after start date`,
          });
        }
      }
    }

    // Update years array
    batch.years = years;
    await batch.save();

    // Populate department before sending response
    await batch.populate({
      path: 'department_id',
      select: 'name duration_years'
    });

    res.status(200).json({
      success: true,
      message: 'Batch updated successfully',
      data: batch,
    });
  } catch (error) {
    console.error('Error updating batch:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation error',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update batch',
      error: error.message,
    });
  }
};

/**
 * @desc    Soft delete batch
 * @route   DELETE /api/admin/batches/:id
 * @access  Private (requires 'all' or 'manage_batches' permission)
 */
export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await Batch.findOne({ _id: id, isDeleted: false });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found or already deleted',
      });
    }

    batch.isDeleted = true;
    await batch.save();

    res.status(200).json({
      success: true,
      message: 'Batch archived successfully',
    });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive batch',
      error: error.message,
    });
  }
};

/**
 * @desc    Restore soft deleted batch
 * @route   PUT /api/admin/batches/:id/restore
 * @access  Private (requires 'all' or 'manage_batches' permission)
 */
export const restoreBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await Batch.findOne({ _id: id, isDeleted: true });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Archived batch not found',
      });
    }

    // CRITICAL FIX #2: Check if department exists and is active
    const department = await Department.findOne({
      _id: batch.department_id,
      isDeleted: false
    });

    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Cannot restore batch: associated department no longer exists or has been deleted',
      });
    }

    batch.isDeleted = false;
    await batch.save();

    // Populate department before sending response
    await batch.populate({
      path: 'department_id',
      select: 'name duration_years'
    });

    res.status(200).json({
      success: true,
      message: 'Batch restored successfully',
      data: batch,
    });
  } catch (error) {
    console.error('Error restoring batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore batch',
      error: error.message,
    });
  }
};
