import api from '../config/api';

/**
 * Get all wash requests for the current student
 * @returns {Promise<Object>} - List of wash requests
 */
export const getMyWashRequests = async () => {
  try {
    const response = await api.get('/wash-requests/my-requests');
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Get wash requests error:', error);
    throw {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to fetch wash requests',
    };
  }
};

/**
 * Create a new wash request
 * @param {number} cloth_count - Number of clothes
 * @param {string} notes - Additional notes
 * @returns {Promise<Object>} - Created wash request
 */
export const createWashRequest = async (cloth_count, notes) => {
  try {
    const response = await api.post('/wash-requests', {
      cloth_count,
      notes,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Create wash request error:', error);
    throw {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to create wash request',
    };
  }
};

/**
 * Get details of a specific wash request
 * @param {string} id - Wash request ID
 * @returns {Promise<Object>} - Wash request details
 */
export const getWashRequestDetails = async (id) => {
  try {
    const response = await api.get(`/wash-requests/${id}`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Get wash request details error:', error);
    throw {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to fetch wash request details',
    };
  }
};

/**
 * Format wash request status for display
 * @param {string} status - Status code
 * @returns {Object} - Formatted status with label and color
 */
export const formatStatus = (status) => {
  const statusMap = {
    pickup_pending: { label: 'Pickup Pending', color: '#F59E0B' },
    picked_up: { label: 'Picked Up', color: '#3B82F6' },
    washing: { label: 'Washing', color: '#8B5CF6' },
    completed: { label: 'Completed', color: '#10B981' },
    returned: { label: 'Returned', color: '#06B6D4' },
    cancelled: { label: 'Cancelled', color: '#EF4444' },
  };

  return statusMap[status] || { label: status, color: '#6B7280' };
};
