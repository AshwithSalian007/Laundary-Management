import axiosInstance from '../../../config/axios';

const washRequestService = {
  // Get all wash requests with filters
  getAllWashRequests: async (filters = {}) => {
    try {
      const params = {
        status: filters.status || undefined,
        student_id: filters.student_id || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        page: filters.page || 1,
        limit: filters.limit || 20,
        sort_by: filters.sort_by || 'createdAt',
        sort_order: filters.sort_order || 'desc',
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await axiosInstance.get('/admin/wash-requests', { params });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to fetch wash requests' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Get single wash request by ID
  getWashRequestById: async (id) => {
    try {
      const response = await axiosInstance.get(`/admin/wash-requests/${id}`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to fetch wash request details' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Update wash request weight
  updateWeight: async (id, weight_kg) => {
    try {
      const response = await axiosInstance.put(`/admin/wash-requests/${id}/weight`, {
        weight_kg: parseFloat(weight_kg),
      });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to update weight' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Update wash request status
  updateStatus: async (id, status, cancellation_reason = null) => {
    try {
      const response = await axiosInstance.put(`/admin/wash-requests/${id}/status`, {
        status,
        cancellation_reason,
      });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to update status' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Get wash request statistics
  getStats: async () => {
    try {
      const response = await axiosInstance.get('/admin/wash-requests/stats');
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to fetch statistics' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Delete wash request (soft delete)
  deleteWashRequest: async (id) => {
    try {
      const response = await axiosInstance.delete(`/admin/wash-requests/${id}`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to delete wash request' };
      throw { ...errorData, status: error.response?.status };
    }
  },
};

export default washRequestService;
