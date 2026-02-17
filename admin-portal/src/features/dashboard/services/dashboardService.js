import axiosInstance from '../../../config/axios';

const dashboardService = {
  // Get dashboard statistics (by status) - accessible to all admins
  getWashRequestStats: async () => {
    try {
      const response = await axiosInstance.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to fetch statistics' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Get recent wash requests for activity feed - accessible to all admins
  getRecentWashRequests: async (limit = 5) => {
    try {
      const response = await axiosInstance.get('/admin/dashboard/recent-requests', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to fetch recent requests' };
      throw { ...errorData, status: error.response?.status };
    }
  },
};

export default dashboardService;
