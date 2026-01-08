import WashRequest from '../models/WashRequest.js';
import YearlyWashPlan from '../models/YearlyWashPlan.js';
import Student from '../models/Student.js';
import mongoose from 'mongoose';

// @desc    Get all wash requests (admin)
// @route   GET /api/admin/wash-requests
// @access  Private (Admin with process_wash permission)
export const getAllWashRequests = async (req, res) => {
  try {
    const {
      status,
      student_id,
      date_from,
      date_to,
      page = 1,
      limit = 20,
      sort_by = 'createdAt',
      sort_order = 'desc',
    } = req.query;

    // Build filter query
    const filter = { isDeleted: false };

    if (status) {
      filter.status = status;
    }

    if (student_id) {
      filter.student_id = student_id;
    }

    if (date_from || date_to) {
      filter.createdAt = {};
      if (date_from) {
        filter.createdAt.$gte = new Date(date_from);
      }
      if (date_to) {
        filter.createdAt.$lte = new Date(date_to);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = sort_order === 'asc' ? 1 : -1;

    // Execute query with population
    const washRequests = await WashRequest.find(filter)
      .populate({
        path: 'student_id',
        select: 'name roll_no email',
        populate: {
          path: 'batch_id',
          select: 'name year',
        },
      })
      .populate('plan_id', 'year_no total_washes remaining_washes max_weight_per_wash')
      .populate('processed_by', 'email')
      .sort({ [sort_by]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await WashRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: washRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
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

// @desc    Get single wash request details
// @route   GET /api/admin/wash-requests/:id
// @access  Private (Admin with process_wash permission)
export const getWashRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const washRequest = await WashRequest.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate({
        path: 'student_id',
        select: 'name roll_no email phone',
        populate: {
          path: 'batch_id',
          select: 'name year',
          populate: {
            path: 'department_id',
            select: 'name code',
          },
        },
      })
      .populate('plan_id', 'year_no total_washes used_washes remaining_washes max_weight_per_wash')
      .populate('processed_by', 'email')
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
    console.error('Error fetching wash request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wash request details',
      error: error.message,
    });
  }
};

// @desc    Add/Update weight and move to washing status
// @route   PUT /api/admin/wash-requests/:id/weight
// @access  Private (Admin with process_wash permission)
export const updateWashRequestWeight = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { weight_kg } = req.body;
    const adminId = req.user._id || req.user.id; // Support both formats

    // Validate weight input
    if (!weight_kg || weight_kg <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Please provide valid weight (must be greater than 0)',
      });
    }

    // Find wash request
    const washRequest = await WashRequest.findOne({
      _id: id,
      isDeleted: false,
    }).session(session);

    if (!washRequest) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Wash request not found',
      });
    }

    // Check if request can be modified
    if (washRequest.status === 'cancelled' || washRequest.status === 'returned') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot modify wash request in '${washRequest.status}' status`,
      });
    }

    // Get the wash plan
    const washPlan = await YearlyWashPlan.findById(washRequest.plan_id).session(session);

    if (!washPlan) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Wash plan not found',
      });
    }

    // Calculate required wash count
    const newWashCount = Math.ceil(weight_kg / washPlan.max_weight_per_wash);
    const oldWashCount = washRequest.wash_count || 0;
    const washCountDifference = newWashCount - oldWashCount;

    // Check if student has enough remaining washes
    if (washCountDifference > washPlan.remaining_washes) {
      // Insufficient washes - auto-cancel the request
      washRequest.status = 'cancelled';
      washRequest.cancellation_reason = `Insufficient washes. Required: ${newWashCount}, Available: ${washPlan.remaining_washes}. Please contact administration.`;
      washRequest.processed_by = adminId;
      await washRequest.save({ session });

      await session.commitTransaction();

      return res.status(400).json({
        success: false,
        message: 'Insufficient washes - Request auto-cancelled',
        data: {
          required_washes: newWashCount,
          available_washes: washPlan.remaining_washes,
          washRequest: washRequest,
        },
      });
    }

    // Update wash request with weight
    const previousWeight = washRequest.weight_kg;
    washRequest.weight_kg = weight_kg;
    // wash_count will be auto-calculated by pre-save hook
    washRequest.processed_by = adminId;

    // If moving to washing status for the first time
    if (washRequest.status === 'pickup_pending' || washRequest.status === 'picked_up') {
      washRequest.status = 'washing';
    }

    await washRequest.save({ session });

    // Update wash plan counters
    // Note: remaining_washes is auto-calculated by YearlyWashPlan pre-save hook
    washPlan.used_washes += washCountDifference;
    await washPlan.save({ session });

    await session.commitTransaction();

    // Fetch updated request with populated fields
    const updatedRequest = await WashRequest.findById(id)
      .populate({
        path: 'student_id',
        select: 'name roll_no email',
        populate: {
          path: 'batch_id',
          select: 'name year',
        },
      })
      .populate('plan_id', 'year_no total_washes used_washes remaining_washes max_weight_per_wash')
      .populate('processed_by', 'email')
      .lean();

    res.status(200).json({
      success: true,
      message: previousWeight
        ? 'Weight updated and wash count recalculated successfully'
        : 'Weight added successfully',
      data: updatedRequest,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating weight:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update weight',
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// @desc    Update wash request status
// @route   PUT /api/admin/wash-requests/:id/status
// @access  Private (Admin with process_wash permission)
export const updateWashRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellation_reason } = req.body;
    const adminId = req.user._id || req.user.id; // Support both formats

    // Validate status
    const validStatuses = ['pickup_pending', 'picked_up', 'washing', 'completed', 'returned', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    // Find wash request
    const washRequest = await WashRequest.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!washRequest) {
      return res.status(404).json({
        success: false,
        message: 'Wash request not found',
      });
    }

    // Validate status transition
    const currentStatus = washRequest.status;

    // Cannot change status if already returned or cancelled
    if (currentStatus === 'returned' && status !== 'returned') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify returned request',
      });
    }

    // If cancelling, require cancellation reason
    if (status === 'cancelled' && !cancellation_reason && !washRequest.cancellation_reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide cancellation reason',
      });
    }

    // Update status
    washRequest.status = status;
    washRequest.processed_by = adminId;

    if (status === 'cancelled' && cancellation_reason) {
      washRequest.cancellation_reason = cancellation_reason;
    }

    if (status === 'returned') {
      washRequest.returned_date = new Date();
    }

    await washRequest.save();

    // Fetch updated request with populated fields
    const updatedRequest = await WashRequest.findById(id)
      .populate({
        path: 'student_id',
        select: 'name roll_no email',
        populate: {
          path: 'batch_id',
          select: 'name year',
        },
      })
      .populate('plan_id', 'year_no total_washes used_washes remaining_washes max_weight_per_wash')
      .populate('processed_by', 'email')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: updatedRequest,
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message,
    });
  }
};

// @desc    Get wash request statistics
// @route   GET /api/admin/wash-requests/stats
// @access  Private (Admin with process_wash permission)
export const getWashRequestStats = async (req, res) => {
  try {
    const stats = await WashRequest.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Format stats
    const formattedStats = {
      pickup_pending: 0,
      picked_up: 0,
      washing: 0,
      completed: 0,
      returned: 0,
      cancelled: 0,
      total: 0,
    };

    stats.forEach((stat) => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.status(200).json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
};

// @desc    Delete wash request (soft delete)
// @route   DELETE /api/admin/wash-requests/:id
// @access  Private (Admin with process_wash permission)
export const deleteWashRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const washRequest = await WashRequest.findById(id);

    if (!washRequest) {
      return res.status(404).json({
        success: false,
        message: 'Wash request not found',
      });
    }

    // Check if request has washes deducted (status: washing, completed, or returned)
    // Cannot delete requests with deducted washes to maintain data integrity
    const hasDeductedWashes = ['washing', 'completed', 'returned'].includes(washRequest.status);

    if (hasDeductedWashes) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete wash request in '${washRequest.status}' status. Washes have already been deducted. Please cancel or return the request instead.`,
        data: {
          status: washRequest.status,
          wash_count: washRequest.wash_count,
        },
      });
    }

    // Only allow deletion of pickup_pending, picked_up, or cancelled requests
    // Soft delete
    washRequest.isDeleted = true;
    await washRequest.save();

    res.status(200).json({
      success: true,
      message: 'Wash request deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting wash request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete wash request',
      error: error.message,
    });
  }
};
