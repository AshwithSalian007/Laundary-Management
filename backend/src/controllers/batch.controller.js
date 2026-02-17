import Batch from '../models/Batch.js';
import Department from '../models/Department.js';
import Student from '../models/Student.js';
import YearlyWashPlan from '../models/YearlyWashPlan.js';
import WashPolicy from '../models/WashPolicy.js';

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

    // Filter out batches with deleted departments to prevent displaying orphaned batches in the UI
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

    // Validation: Check required fields (end_date is optional)
    if (!department_id || !start_year || !end_year || !year_1_start_date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: department, start year, end year, and year 1 start date',
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

    if (isNaN(year1Start.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format for year 1 start date',
      });
    }

    // Validate year 1 end date if provided
    let year1End = null;
    if (year_1_end_date) {
      year1End = new Date(year_1_end_date);

      if (isNaN(year1End.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format for year 1 end date',
        });
      }

      if (year1End <= year1Start) {
        return res.status(400).json({
          success: false,
          message: 'Year 1 end date must be after start date',
        });
      }
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

    // Year 1: Use provided dates (end_date may be null)
    years.push({
      year_no: 1,
      start_date: year1Start,
      end_date: year1End // Can be null
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

    // Use already-fetched department instead of re-populating to avoid potential inconsistency
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

      // Start date is required if end date is provided
      if (!year.start_date && year.end_date) {
        return res.status(400).json({
          success: false,
          message: `Year ${year.year_no}: Start date is required when end date is provided`,
        });
      }

      // If start date is provided, validate it
      if (year.start_date) {
        const startDate = new Date(year.start_date);

        if (isNaN(startDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: `Invalid date format for year ${year.year_no} start date`,
          });
        }
      }

      // If end date is provided, validate it
      if (year.end_date) {
        const endDate = new Date(year.end_date);

        if (isNaN(endDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: `Invalid date format for year ${year.year_no} end date`,
          });
        }

        // If both dates exist, ensure end_date > start_date
        if (year.start_date) {
          const startDate = new Date(year.start_date);
          if (endDate <= startDate) {
            return res.status(400).json({
              success: false,
              message: `Year ${year.year_no}: End date must be after start date`,
            });
          }
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

    // Check if department exists and is active
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

/**
 * @desc    Promote batch to next year
 * @route   POST /api/admin/batches/:id/promote
 * @access  Private (requires 'all' or 'manage_batches' permission)
 */
export const promoteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { total_washes, max_weight_per_wash } = req.body;

    // Find batch with department information
    const batch = await Batch.findOne({ _id: id, isDeleted: false }).populate({
      path: 'department_id',
      select: 'name duration_years isDeleted'
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found or has been deleted',
      });
    }

    // Check if department is deleted
    if (!batch.department_id || batch.department_id.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot promote batch: associated department has been deleted',
      });
    }

    // Validate: Check if batch can be promoted (not beyond final year)
    const maxYear = batch.department_id.duration_years;
    if (batch.current_year > maxYear) {
      return res.status(400).json({
        success: false,
        message: `Cannot promote batch: already beyond final year (${maxYear})`,
      });
    }

    const currentYearNo = batch.current_year;
    const nextYearNo = currentYearNo + 1;

    // Validate: Check if next year's start_date is set
    const nextYearConfig = batch.years.find(y => y.year_no === nextYearNo);
    if (!nextYearConfig || !nextYearConfig.start_date) {
      return res.status(400).json({
        success: false,
        message: `Cannot promote: Year ${nextYearNo} start date is not configured in batch settings`,
      });
    }

    // Get or validate wash policy
    let policyToUse = {};

    if (total_washes !== undefined || max_weight_per_wash !== undefined) {
      // Admin provided custom policy values
      if (total_washes !== undefined) {
        if (typeof total_washes !== 'number' || total_washes < 0) {
          return res.status(400).json({
            success: false,
            message: 'total_washes must be a non-negative number',
          });
        }
        policyToUse.total_washes = total_washes;
      }

      if (max_weight_per_wash !== undefined) {
        if (typeof max_weight_per_wash !== 'number' || max_weight_per_wash < 0.1) {
          return res.status(400).json({
            success: false,
            message: 'max_weight_per_wash must be at least 0.1 kg',
          });
        }
        policyToUse.max_weight_per_wash = max_weight_per_wash;
      }

      // If only one value provided, get the other from active policy
      if (total_washes === undefined || max_weight_per_wash === undefined) {
        const activePolicy = await WashPolicy.findOne({ is_active: true, isDeleted: false });

        if (!activePolicy) {
          return res.status(400).json({
            success: false,
            message: 'No active wash policy found. Please provide both total_washes and max_weight_per_wash',
          });
        }

        if (total_washes === undefined) {
          policyToUse.total_washes = activePolicy.total_washes;
        }
        if (max_weight_per_wash === undefined) {
          policyToUse.max_weight_per_wash = activePolicy.max_weight_per_wash;
        }
        policyToUse.policy_id = activePolicy._id;
      } else {
        // Both values provided by admin - still need active policy for reference
        const activePolicy = await WashPolicy.findOne({ is_active: true, isDeleted: false });

        if (!activePolicy) {
          return res.status(400).json({
            success: false,
            message: 'No active wash policy found. A policy reference is required even when using custom values. Please activate a wash policy first.',
          });
        }

        policyToUse.policy_id = activePolicy._id;
      }
    } else {
      // No custom values - use active policy
      const activePolicy = await WashPolicy.findOne({ is_active: true, isDeleted: false });

      if (!activePolicy) {
        return res.status(400).json({
          success: false,
          message: 'No active wash policy found. Please activate a policy or provide custom total_washes and max_weight_per_wash values',
        });
      }

      policyToUse = {
        policy_id: activePolicy._id,
        total_washes: activePolicy.total_washes,
        max_weight_per_wash: activePolicy.max_weight_per_wash
      };
    }

    // Get current date for end_date of closing plans
    const promotionDate = new Date();

    // Step 1: Close all active wash plans for current year
    const closeResult = await YearlyWashPlan.updateMany(
      {
        batch_id: batch._id,
        year_no: currentYearNo,
        is_active: true
      },
      {
        $set: {
          end_date: promotionDate,
          is_active: false
        }
      }
    );

    // Step 2: Get all active students in this batch
    const activeStudents = await Student.find({
      batch_id: batch._id,
      hostel_status: 'active',
      isDeleted: false
    });

    // Step 3: Create new wash plans for non-graduate students
    let plansCreated = 0;
    const newPlans = [];

    if (nextYearNo <= maxYear) {
      // Not final year - create new plans
      for (const student of activeStudents) {
        const newPlan = await YearlyWashPlan.create({
          student_id: student._id,
          batch_id: batch._id,
          year_no: nextYearNo,
          policy_id: policyToUse.policy_id,
          total_washes: policyToUse.total_washes,
          max_weight_per_wash: policyToUse.max_weight_per_wash,
          used_washes: 0,
          remaining_washes: policyToUse.total_washes,
          start_date: nextYearConfig.start_date,
          end_date: null,
          is_active: true
        });
        newPlans.push(newPlan);
        plansCreated++;
      }
    }

    // Step 4: Update batch current_year and set end_date for current year
    const currentYearIndex = batch.years.findIndex(y => y.year_no === currentYearNo);
    if (currentYearIndex !== -1) {
      batch.years[currentYearIndex].end_date = promotionDate;
    }

    batch.current_year = nextYearNo;
    await batch.save();

    // Prepare response
    const isGraduating = nextYearNo > maxYear;

    res.status(200).json({
      success: true,
      message: isGraduating
        ? `Batch promoted successfully. ${activeStudents.length} students graduated.`
        : `Batch promoted successfully from Year ${currentYearNo} to Year ${nextYearNo}`,
      data: {
        batch: {
          _id: batch._id,
          batch_label: batch.batch_label,
          previous_year: currentYearNo,
          current_year: batch.current_year,
          department: batch.department_id.name
        },
        promotion_summary: {
          plans_closed: closeResult.modifiedCount,
          new_plans_created: plansCreated,
          active_students: activeStudents.length,
          is_graduating: isGraduating,
          policy_used: policyToUse.policy_id ? 'Active Policy' : 'Custom Policy',
          total_washes: policyToUse.total_washes,
          max_weight_per_wash: policyToUse.max_weight_per_wash
        }
      }
    });
  } catch (error) {
    console.error('Error promoting batch:', error);

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
      message: 'Failed to promote batch',
      error: error.message,
    });
  }
};
