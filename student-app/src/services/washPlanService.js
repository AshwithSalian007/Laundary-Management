import api from '../config/api';

/**
 * Get current student's active wash plan
 * @returns {Promise<Object>} - Wash plan data
 */
export const getMyWashPlan = async () => {
  try {
    const response = await api.get('/wash-plans/my-plan');
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Get wash plan error:', error);
    throw {
      success: false,
      message: error.message || 'Failed to fetch wash plan',
    };
  }
};

/**
 * Calculate wash plan statistics
 * @param {Object} washPlan - Wash plan object
 * @returns {Object} - Calculated statistics
 */
export const calculateWashStats = (washPlan) => {
  if (!washPlan) return null;

  const {
    total_washes = 0,
    used_washes = 0,
    remaining_washes = 0,
  } = washPlan;

  // Calculate percentage
  const usagePercentage = total_washes > 0
    ? Math.round((used_washes / total_washes) * 100)
    : 0;

  const remainingPercentage = 100 - usagePercentage;

  // Determine status color (green to red gradient)
  let statusColor = '#10B981'; // Green (good)
  let statusText = 'Excellent';

  if (remainingPercentage < 20) {
    statusColor = '#EF4444'; // Red (critical)
    statusText = 'Critical';
  } else if (remainingPercentage < 40) {
    statusColor = '#F59E0B'; // Orange (warning)
    statusText = 'Low';
  } else if (remainingPercentage < 60) {
    statusColor = '#FBBF24'; // Yellow (moderate)
    statusText = 'Moderate';
  }

  return {
    total_washes,
    used_washes,
    remaining_washes,
    usagePercentage,
    remainingPercentage,
    statusColor,
    statusText,
  };
};

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
export const formatPlanDate = (dateString) => {
  if (!dateString) return 'Ongoing';

  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-IN', options);
};
