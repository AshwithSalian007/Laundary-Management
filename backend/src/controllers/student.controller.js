import Student from '../models/Student.js';
import Batch from '../models/Batch.js';
import Department from '../models/Department.js';
import OTP from '../models/OTP.js';
import { sendWelcomeEmail } from '../services/email.service.js';
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
      otp,
    } = req.body;

    // Validation: Check required fields
    if (
      !name ||
      !email ||
      !password ||
      !phone_number ||
      !registration_number ||
      !gender ||
      !batch_id ||
      !otp
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields including OTP',
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

    // Verify OTP before creating student
    const otpRecord = await OTP.findOne({
      user_email: email.toLowerCase(),
      otp_type: 'email_verification',
      is_used: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found or OTP has expired. Please request a new OTP.',
      });
    }

    // Check if OTP expired
    if (new Date() > otpRecord.expires_at) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one',
      });
    }

    // Check attempts limit
    if (otpRecord.attempts >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP',
      });
    }

    // Verify OTP
    const isValid = await otpRecord.verifyOTP(otp);

    if (!isValid) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining`,
      });
    }

    // Delete OTP immediately after successful verification (cleanup)
    await OTP.deleteOne({ _id: otpRecord._id });

    // Check if email already exists
    const existingStudent = await Student.findOne({
      email: email.toLowerCase(),
    });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'A student with this email already exists',
      });
    }

    // Check if registration number already exists
    const existingRegNumber = await Student.findOne({ registration_number });
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

    // Create student with email already verified
    const student = await Student.create({
      name,
      email: email.toLowerCase(),
      password,
      phone_number,
      registration_number,
      gender,
      batch_id,
      email_verified: true,
      email_verified_at: new Date(),
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email.toLowerCase(), name, password).catch(err =>
      console.error('Failed to send welcome email:', err)
    );

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

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: studentResponse,
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
