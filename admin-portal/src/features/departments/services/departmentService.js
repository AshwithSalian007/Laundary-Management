import axiosInstance from '../../../config/axios';

const departmentService = {
  // Get all departments
  getAllDepartments: async (includeDeleted = false) => {
    try {
      const params = includeDeleted ? { includeDeleted: 'true' } : {};
      const response = await axiosInstance.get('/admin/departments', { params });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to fetch departments' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Create new department
  createDepartment: async (departmentData) => {
    try {
      const response = await axiosInstance.post('/admin/departments', departmentData);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to create department' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Update department
  updateDepartment: async (departmentId, departmentData) => {
    try {
      const response = await axiosInstance.put(`/admin/departments/${departmentId}`, departmentData);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to update department' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Delete department (soft delete)
  deleteDepartment: async (departmentId) => {
    try {
      const response = await axiosInstance.delete(`/admin/departments/${departmentId}`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to delete department' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Restore soft-deleted department
  restoreDepartment: async (departmentId) => {
    try {
      const response = await axiosInstance.put(`/admin/departments/${departmentId}/restore`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to restore department' };
      throw { ...errorData, status: error.response?.status };
    }
  },
};

export default departmentService;
