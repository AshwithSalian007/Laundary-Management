import api from '../../../config/api';

export const washService = {
  // Get student's active wash plan
  getMyWashPlan: async () => {
    try {
      const response = await api.get('/wash-plans/my-plan');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch wash plan' };
    }
  },

  // Get my wash requests
  getMyWashRequests: async () => {
    try {
      const response = await api.get('/wash-requests/my-requests');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch wash requests' };
    }
  },

  // Create new wash request
  createWashRequest: async (data) => {
    try {
      const response = await api.post('/wash-requests', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create wash request' };
    }
  },

  // Get wash request details
  getWashRequestDetails: async (id) => {
    try {
      const response = await api.get(`/wash-requests/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch request details' };
    }
  },
};
