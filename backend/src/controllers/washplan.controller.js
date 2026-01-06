import YearlyWashPlan from '../models/YearlyWashPlan.js';
import Student from '../models/Student.js';
import Batch from '../models/Batch.js';
import WashPolicy from '../models/WashPolicy.js';

// @desc    Get student's active wash plan
// @route   GET /api/wash-plans/my-plan
// @access  Private (Student)
export const getMyWashPlan = async (req, res) => {
  try {
    // req.user is set by protect middleware
    const studentId = req.user._id;

    // Find the student's active wash plan
    const washPlan = await YearlyWashPlan.findOne({
      student_id: studentId,
      is_active: true,
      isDeleted: false,
    })
      .populate('policy_id', 'name')
      .populate('batch_id', 'batch_label current_year')
      .lean();

    if (!washPlan) {
      return res.status(404).json({
        success: false,
        message: 'No active wash plan found',
      });
    }

    res.status(200).json({
      success: true,
      data: washPlan,
    });
  } catch (error) {
    console.error('Error fetching wash plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wash plan',
      error: error.message,
    });
  }
};
