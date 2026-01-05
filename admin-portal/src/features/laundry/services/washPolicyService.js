import axiosInstance from '../../../config/axios';

const washPolicyService = {
  // Get all wash policies
  getAllPolicies: async (includeDeleted = false) => {
    try {
      const params = includeDeleted ? { includeDeleted: 'true' } : {};
      const response = await axiosInstance.get('/admin/policies', { params });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to fetch policies' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Create new wash policy
  createPolicy: async (policyData) => {
    try {
      const response = await axiosInstance.post('/admin/policies', policyData);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to create policy' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Update wash policy
  updatePolicy: async (policyId, policyData) => {
    try {
      const response = await axiosInstance.put(`/admin/policies/${policyId}`, policyData);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to update policy' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Delete wash policy (soft delete)
  deletePolicy: async (policyId) => {
    try {
      const response = await axiosInstance.delete(`/admin/policies/${policyId}`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to delete policy' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Restore soft-deleted wash policy
  restorePolicy: async (policyId) => {
    try {
      const response = await axiosInstance.put(`/admin/policies/${policyId}/restore`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to restore policy' };
      throw { ...errorData, status: error.response?.status };
    }
  },
};

export default washPolicyService;
