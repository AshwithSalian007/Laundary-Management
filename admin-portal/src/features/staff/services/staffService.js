import axiosInstance from '../../../config/axios';

const staffService = {
  // Get all staff
  getAllStaff: async () => {
    try {
      const response = await axiosInstance.get('/admin/staff');
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to fetch staff' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Create new staff
  createStaff: async (staffData) => {
    try {
      const response = await axiosInstance.post('/admin/staff', staffData);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to create staff' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Update staff role
  updateStaffRole: async (staffId, roleId) => {
    try {
      const response = await axiosInstance.put(`/admin/staff/${staffId}/role`, { roleId });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to update staff role' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Delete/Deactivate staff
  deleteStaff: async (staffId) => {
    try {
      const response = await axiosInstance.delete(`/admin/staff/${staffId}`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to delete staff' };
      throw { ...errorData, status: error.response?.status };
    }
  },
};

export default staffService;
