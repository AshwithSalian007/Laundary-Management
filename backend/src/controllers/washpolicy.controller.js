import WashPolicy from '../models/WashPolicy.js';

/**
 * @desc    Get all wash policies (active and optionally deleted)
 * @route   GET /api/admin/policies
 * @access  Private (requires 'all' or 'manage_policies' permission)
 */
export const getAllWashPolicies = async (req, res) => {
  try {
    const { includeDeleted } = req.query;

    let query = {};
    if (includeDeleted !== 'true') {
      query.isDeleted = false;
    }

    const policies = await WashPolicy.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: policies.length,
      data: policies,
    });
  } catch (error) {
    console.error('Error fetching wash policies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wash policies',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new wash policy
 * @route   POST /api/admin/policies
 * @access  Private (requires 'all' or 'manage_policies' permission)
 */
export const createWashPolicy = async (req, res) => {
  try {
    const { name, total_washes, max_weight_per_wash, is_active } = req.body;

    // Validation: Check required fields
    if (!name || total_washes === undefined || max_weight_per_wash === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, total_washes, and max_weight_per_wash',
      });
    }

    // Validate numeric fields
    const totalWashesNum = Number(total_washes);
    const maxWeightNum = Number(max_weight_per_wash);

    if (isNaN(totalWashesNum) || isNaN(maxWeightNum)) {
      return res.status(400).json({
        success: false,
        message: 'Total washes and max weight per wash must be valid numbers',
      });
    }

    if (totalWashesNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total washes must be a non-negative number',
      });
    }

    if (maxWeightNum < 0.1) {
      return res.status(400).json({
        success: false,
        message: 'Maximum weight per wash must be at least 0.1 kg',
      });
    }

    // CRITICAL: Active policy validation
    // If creating an active policy, check if another active policy already exists
    if (is_active === true) {
      const existingActivePolicy = await WashPolicy.findOne({
        is_active: true,
        isDeleted: false,
      });

      if (existingActivePolicy) {
        return res.status(400).json({
          success: false,
          message: 'An active policy already exists. Please deactivate the current active policy before creating a new one.',
        });
      }
    }

    // Create the wash policy
    const policy = await WashPolicy.create({
      name,
      total_washes: totalWashesNum,
      max_weight_per_wash: maxWeightNum,
      is_active: is_active || false,
    });

    res.status(201).json({
      success: true,
      message: 'Wash policy created successfully',
      data: policy,
    });
  } catch (error) {
    console.error('Error creating wash policy:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create wash policy',
      error: error.message,
    });
  }
};

/**
 * @desc    Update wash policy
 * @route   PUT /api/admin/policies/:id
 * @access  Private (requires 'all' or 'manage_policies' permission)
 */
export const updateWashPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, total_washes, max_weight_per_wash, is_active } = req.body;

    // Find the policy (exclude soft-deleted)
    const policy = await WashPolicy.findOne({ _id: id, isDeleted: false });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found or has been deleted',
      });
    }

    // Validate numeric fields if provided
    if (total_washes !== undefined) {
      const totalWashesNum = Number(total_washes);
      if (isNaN(totalWashesNum) || totalWashesNum < 0) {
        return res.status(400).json({
          success: false,
          message: 'Total washes must be a non-negative number',
        });
      }
      policy.total_washes = totalWashesNum;
    }

    if (max_weight_per_wash !== undefined) {
      const maxWeightNum = Number(max_weight_per_wash);
      if (isNaN(maxWeightNum) || maxWeightNum < 0.1) {
        return res.status(400).json({
          success: false,
          message: 'Maximum weight per wash must be at least 0.1 kg',
        });
      }
      policy.max_weight_per_wash = maxWeightNum;
    }

    // CRITICAL: Active policy validation
    // Only validate if changing is_active to true
    if (is_active === true && policy.is_active !== true) {
      const existingActivePolicy = await WashPolicy.findOne({
        is_active: true,
        isDeleted: false,
        _id: { $ne: id },
      });

      if (existingActivePolicy) {
        return res.status(400).json({
          success: false,
          message: 'An active policy already exists. Please deactivate the current active policy before activating this one.',
        });
      }
    }

    // Update fields
    if (name !== undefined) policy.name = name;
    if (is_active !== undefined) policy.is_active = is_active;

    await policy.save();

    res.status(200).json({
      success: true,
      message: 'Wash policy updated successfully',
      data: policy,
    });
  } catch (error) {
    console.error('Error updating wash policy:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update wash policy',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete wash policy (soft delete)
 * @route   DELETE /api/admin/policies/:id
 * @access  Private (requires 'all' or 'manage_policies' permission)
 */
export const deleteWashPolicy = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the policy (exclude already deleted)
    const policy = await WashPolicy.findOne({ _id: id, isDeleted: false });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found or has already been deleted',
      });
    }

    // Soft delete (no restriction on deleting active policies per business rules)
    policy.isDeleted = true;
    await policy.save();

    res.status(200).json({
      success: true,
      message: 'Wash policy archived successfully',
    });
  } catch (error) {
    console.error('Error deleting wash policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive wash policy',
      error: error.message,
    });
  }
};

/**
 * @desc    Restore soft-deleted wash policy
 * @route   PUT /api/admin/policies/:id/restore
 * @access  Private (requires 'all' or 'manage_policies' permission)
 */
export const restoreWashPolicy = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the archived policy
    const policy = await WashPolicy.findOne({ _id: id, isDeleted: true });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Archived policy not found',
      });
    }

    // CRITICAL: If the policy being restored is active, check for conflicts
    // This prevents restoring an active policy when another policy is already active
    if (policy.is_active === true) {
      const existingActivePolicy = await WashPolicy.findOne({
        is_active: true,
        isDeleted: false,
        _id: { $ne: id },
      });

      if (existingActivePolicy) {
        return res.status(400).json({
          success: false,
          message: 'Cannot restore this policy as active because another active policy already exists. Please deactivate the current active policy first, or restore this policy as inactive.',
        });
      }
    }

    // Restore the policy
    policy.isDeleted = false;
    await policy.save();

    res.status(200).json({
      success: true,
      message: 'Wash policy restored successfully',
      data: policy,
    });
  } catch (error) {
    console.error('Error restoring wash policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore wash policy',
      error: error.message,
    });
  }
};
