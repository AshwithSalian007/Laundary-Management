import Department from '../models/Department.js';

// @desc    Get all departments (including deleted if query param included)
// @route   GET /api/admin/departments
// @access  Private (manage_departments or all permission)
export const getAllDepartments = async (req, res) => {
  try {
    const { includeDeleted } = req.query;

    let query = {};
    if (includeDeleted !== 'true') {
      query.isDeleted = false;
    }

    const departments = await Department.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message,
    });
  }
};

// @desc    Create new department
// @route   POST /api/admin/departments
// @access  Private (manage_departments or all permission)
export const createDepartment = async (req, res) => {
  try {
    const { name, duration_years } = req.body;

    // Validation
    if (!name || !name.trim() || !duration_years) {
      return res.status(400).json({
        success: false,
        message: 'Please provide department name and duration',
      });
    }

    // Check if department with same name already exists (case-insensitive)
    const existingDepartment = await Department.findOne({
      name_lowercase: name.toLowerCase(),
      isDeleted: false,
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists',
      });
    }

    // Create department
    const department = await Department.create({
      name,
      duration_years,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department,
    });
  } catch (error) {
    console.error('Create department error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create department',
      error: error.message,
    });
  }
};

// @desc    Update department
// @route   PUT /api/admin/departments/:id
// @access  Private (manage_departments or all permission)
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration_years } = req.body;

    // Validation
    if (!name || !name.trim() || !duration_years) {
      return res.status(400).json({
        success: false,
        message: 'Please provide department name and duration',
      });
    }

    // Find department
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    if (department.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update deleted department. Please restore it first.',
      });
    }

    // Check if another department with same name exists (case-insensitive)
    if (name.toLowerCase() !== department.name.toLowerCase()) {
      const existingDepartment = await Department.findOne({
        name_lowercase: name.toLowerCase(),
        isDeleted: false,
        _id: { $ne: id },
      });

      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name already exists',
        });
      }
    }

    // Update department
    department.name = name;
    department.duration_years = duration_years;
    await department.save();

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      department,
    });
  } catch (error) {
    console.error('Update department error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update department',
      error: error.message,
    });
  }
};

// @desc    Soft delete department
// @route   DELETE /api/admin/departments/:id
// @access  Private (manage_departments or all permission)
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Find department
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    if (department.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Department is already deleted',
      });
    }

    // Soft delete department
    department.isDeleted = true;
    await department.save();

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: error.message,
    });
  }
};

// @desc    Restore soft-deleted department
// @route   PUT /api/admin/departments/:id/restore
// @access  Private (manage_departments or all permission)
export const restoreDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Find department
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    if (!department.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Department is not deleted',
      });
    }

    // Check if another active department with same name exists
    const existingDepartment = await Department.findOne({
      name_lowercase: department.name_lowercase,
      isDeleted: false,
      _id: { $ne: id },
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Cannot restore: Another department with this name already exists',
      });
    }

    // Restore department
    department.isDeleted = false;
    await department.save();

    res.status(200).json({
      success: true,
      message: 'Department restored successfully',
      department,
    });
  } catch (error) {
    console.error('Restore department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore department',
      error: error.message,
    });
  }
};
