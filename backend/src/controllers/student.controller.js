import Student from '../models/Student.js';
import Batch from '../models/Batch.js';
import OTP from '../models/OTP.js';
import {
  isValidEmail,
  isValidIndianPhoneNumber,
  validatePassword,
  PASSWORD_CONSTRAINTS,
} from '../utils/validation.js';

/**
 * @desc    Get all students
 * @route   GET /api/admin/students
 * @access  Private (requires 'all' or 'manage_students' permission)
 */
export const getAllStudents = async (req, res) => {
  try {
    const { includeDeleted } = req.query;

    let query = {};
    if (includeDeleted !== 'true') {
      query.isDeleted = false;
    }

    const students = await Student.find(query)
      .populate({
        path: 'batch_id',
        select: 'batch_label department_id isDeleted',
        populate: {
          path: 'department_id',
          select: 'name isDeleted',
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new student
 * @route   POST /api/admin/students
 * @access  Private (requires 'all' or 'manage_students' permission)
 */
export const createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone_number,
      registration_number,
      gender,
      batch_id,
    } = req.body;

    // Validation: Check required fields (OTP no longer required here)
    if (
      !name ||
      !email ||
      !password ||
      !phone_number ||
      !registration_number ||
      !gender ||
      !batch_id
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Validate phone number
    if (!isValidIndianPhoneNumber(phone_number)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian phone number starting with 6-9',
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password, PASSWORD_CONSTRAINTS.MIN_LENGTH);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    // Check if email already exists
    const existingStudent = await Student.findOne({
      email: email.toLowerCase(),
    });

    if (existingStudent) {
      // If email exists with email_verified: true, block creation
      if (existingStudent.email_verified) {
        return res.status(400).json({
          success: false,
          message: 'A student with this email already exists and is verified',
        });
      }

      // If email exists with email_verified: false, soft delete the old unverified student
      // This preserves data integrity and allows for recovery if needed
      existingStudent.isDeleted = true;
      await existingStudent.save();

      // Also delete any pending OTPs for this email
      await OTP.deleteMany({ user_email: email.toLowerCase(), otp_type: 'email_verification' });
    }

    // Check if registration number already exists (exclude soft-deleted students)
    const existingRegNumber = await Student.findOne({
      registration_number,
      isDeleted: false,
    });
    if (existingRegNumber) {
      return res.status(400).json({
        success: false,
        message: 'A student with this registration number already exists',
      });
    }

    // Verify batch exists and is active
    const batch = await Batch.findOne({ _id: batch_id, isDeleted: false }).populate(
      'department_id'
    );
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found or has been deleted',
      });
    }

    // Store plain password before it gets hashed (for welcome email later)
    const plainPassword = password;

    // Create student with email NOT verified (will be verified in next step)
    const student = await Student.create({
      name,
      email: email.toLowerCase(),
      password,
      phone_number,
      registration_number,
      gender,
      batch_id,
      email_verified: false,
      email_verified_at: null,
    });

    // Note: Welcome email will be sent after email verification
    // OTP will be sent by frontend when verification page loads

    // Populate batch and department for response
    await student.populate({
      path: 'batch_id',
      select: 'batch_label department_id',
      populate: {
        path: 'department_id',
        select: 'name',
      },
    });

    // Remove hashed password from response
    const studentResponse = student.toObject();
    delete studentResponse.password;

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: studentResponse,
      // Return plain password so frontend can pass it during email verification
      // This allows us to send it in the welcome email
      password: plainPassword,
    });
  } catch (error) {
    console.error('Error creating student:', error);

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
      message: 'Failed to create student',
      error: error.message,
    });
  }
};

/**
 * @desc    Update student
 * @route   PUT /api/admin/students/:id
 * @access  Private (requires 'all' or 'manage_students' permission)
 */
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find student
    const student = await Student.findOne({ _id: id, isDeleted: false });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or has been deleted',
      });
    }

    // If email is being changed, validate and check if it already exists
    if (updateData.email && updateData.email !== student.email) {
      // Validate email format
      if (!isValidEmail(updateData.email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }

      const existingEmail = await Student.findOne({
        email: updateData.email.toLowerCase(),
        _id: { $ne: id },
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'A student with this email already exists',
        });
      }
      // Mark email as unverified if changed
      updateData.email_verified = false;
      updateData.email_verified_at = null;
    }

    // Validate phone number if being updated
    if (updateData.phone_number && updateData.phone_number !== student.phone_number) {
      if (!isValidIndianPhoneNumber(updateData.phone_number)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 10-digit Indian phone number starting with 6-9',
        });
      }
    }

    // Validate password if being updated
    if (updateData.password) {
      const passwordValidation = validatePassword(
        updateData.password,
        PASSWORD_CONSTRAINTS.MIN_LENGTH
      );
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: passwordValidation.message,
        });
      }
    }

    // If registration number is being changed, check if it already exists
    if (
      updateData.registration_number &&
      updateData.registration_number !== student.registration_number
    ) {
      const existingRegNumber = await Student.findOne({
        registration_number: updateData.registration_number,
        _id: { $ne: id },
      });
      if (existingRegNumber) {
        return res.status(400).json({
          success: false,
          message: 'A student with this registration number already exists',
        });
      }
    }

    // If batch is being changed, verify it exists
    if (updateData.batch_id && updateData.batch_id !== student.batch_id.toString()) {
      const batch = await Batch.findOne({
        _id: updateData.batch_id,
        isDeleted: false,
      });
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found or has been deleted',
        });
      }
    }

    // Update allowed fields
    const allowedFields = [
      'name',
      'email',
      'phone_number',
      'registration_number',
      'gender',
      'batch_id',
      'hostel_status',
      'password',
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        student[field] = updateData[field];
      }
    });

    await student.save();

    // Populate batch and department for response
    await student.populate({
      path: 'batch_id',
      select: 'batch_label department_id',
      populate: {
        path: 'department_id',
        select: 'name',
      },
    });

    // Remove password from response
    const studentResponse = student.toObject();
    delete studentResponse.password;

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: studentResponse,
    });
  } catch (error) {
    console.error('Error updating student:', error);

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
      message: 'Failed to update student',
      error: error.message,
    });
  }
};

/**
 * @desc    Soft delete student
 * @route   DELETE /api/admin/students/:id
 * @access  Private (requires 'all' or 'manage_students' permission)
 */
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findOne({ _id: id, isDeleted: false });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or already deleted',
      });
    }

    student.isDeleted = true;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student',
      error: error.message,
    });
  }
};

/**
 * @desc    Restore soft deleted student
 * @route   PUT /api/admin/students/:id/restore
 * @access  Private (requires 'all' or 'manage_students' permission)
 */
export const restoreStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findOne({ _id: id, isDeleted: true });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Deleted student not found',
      });
    }

    // Check if batch still exists and is active
    const batch = await Batch.findOne({
      _id: student.batch_id,
      isDeleted: false,
    });

    if (!batch) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot restore student: associated batch no longer exists or has been deleted. Please assign to a new batch first.',
      });
    }

    student.isDeleted = false;
    await student.save();

    // Populate batch and department for response
    await student.populate({
      path: 'batch_id',
      select: 'batch_label department_id',
      populate: {
        path: 'department_id',
        select: 'name',
      },
    });

    // Remove password from response
    const studentResponse = student.toObject();
    delete studentResponse.password;

    res.status(200).json({
      success: true,
      message: 'Student restored successfully',
      data: studentResponse,
    });
  } catch (error) {
    console.error('Error restoring student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore student',
      error: error.message,
    });
  }
};
