import WashRequest from '../models/WashRequest.js';

// @desc    Get dashboard statistics (wash requests by status)
// @route   GET /api/admin/dashboard/stats
// @access  Private (Any authenticated admin)
export const getDashboardStats = async (req, res) => {
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
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};

// @desc    Get recent wash requests for dashboard activity feed
// @route   GET /api/admin/dashboard/recent-requests
// @access  Private (Any authenticated admin)
export const getRecentRequests = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const washRequests = await WashRequest.find({ isDeleted: false })
      .populate({
        path: 'student_id',
        select: 'name registration_number',
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      data: washRequests,
    });
  } catch (error) {
    console.error('Error fetching recent requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent requests',
      error: error.message,
    });
  }
};
