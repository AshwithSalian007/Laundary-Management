import WashRequest from '../models/WashRequest.js';
import YearlyWashPlan from '../models/YearlyWashPlan.js';
import Student from '../models/Student.js';

// @desc    Get student's wash requests
// @route   GET /api/wash-requests/my-requests
// @access  Private (Student)
export const getMyWashRequests = async (req, res) => {
  try {
    const studentId = req.user._id;

    const washRequests = await WashRequest.find({
      student_id: studentId,
      isDeleted: false,
    })
      .populate('plan_id', 'year_no total_washes')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: washRequests,
      count: washRequests.length,
    });
  } catch (error) {
    console.error('Error fetching wash requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wash requests',
      error: error.message,
    });
  }
};

// @desc    Create new wash request
// @route   POST /api/wash-requests
// @access  Private (Student)
export const createWashRequest = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { weight_kg, cloth_count, notes } = req.body;

    // Validate required fields
    if (!weight_kg || weight_kg <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid weight',
      });
    }

    // Find student's active wash plan
    const washPlan = await YearlyWashPlan.findOne({
      student_id: studentId,
      is_active: true,
      isDeleted: false,
    });

    if (!washPlan) {
      return res.status(404).json({
        success: false,
        message: 'No active wash plan found. Please contact administration.',
      });
    }

    // Calculate wash count
    const washCount = Math.ceil(weight_kg / washPlan.max_weight_per_wash);

    // Check if student has enough washes
    if (washCount > washPlan.remaining_washes) {
      return res.status(400).json({
        success: false,
        message: `Insufficient washes. This request requires ${washCount} washes but you only have ${washPlan.remaining_washes} remaining.`,
      });
    }

    // Create wash request
    const washRequest = await WashRequest.create({
      plan_id: washPlan._id,
      student_id: studentId,
      weight_kg,
      cloth_count: cloth_count || 0,
      wash_count: washCount,
      notes: notes || '',
      given_date: new Date(),
      status: 'pickup_pending',
      // processed_by will be set when staff processes the request
      // For now, we'll need to handle this - either set a default admin or modify the model
    });

    // Update wash plan counters
    washPlan.used_washes += washCount;
    washPlan.remaining_washes -= washCount;
    await washPlan.save();

    res.status(201).json({
      success: true,
      message: 'Wash request created successfully',
      data: washRequest,
    });
  } catch (error) {
    console.error('Error creating wash request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create wash request',
      error: error.message,
    });
  }
};

// @desc    Get wash request details
// @route   GET /api/wash-requests/:id
// @access  Private (Student)
export const getWashRequestDetails = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { id } = req.params;

    const washRequest = await WashRequest.findOne({
      _id: id,
      student_id: studentId,
      isDeleted: false,
    })
      .populate('plan_id', 'year_no total_washes')
      .populate('processed_by', 'name email')
      .lean();

    if (!washRequest) {
      return res.status(404).json({
        success: false,
        message: 'Wash request not found',
      });
    }

    res.status(200).json({
      success: true,
      data: washRequest,
    });
  } catch (error) {
    console.error('Error fetching wash request details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wash request details',
      error: error.message,
    });
  }
};
