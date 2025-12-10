import axiosInstance from '../../../config/axios';

const staffService = {
  // Get all staff
  getAllStaff: async () => {
    try {
      const response = await axiosInstance.get('/admin/staff');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch staff' };
    }
  },

  // Create new staff
  createStaff: async (staffData) => {
    try {
      const response = await axiosInstance.post('/admin/staff', staffData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create staff' };
    }
  },

  // Update staff role
  updateStaffRole: async (staffId, roleId) => {
    try {
      const response = await axiosInstance.put(`/admin/staff/${staffId}/role`, { roleId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update staff role' };
    }
  },

  // Delete/Deactivate staff
  deleteStaff: async (staffId) => {
    try {
      const response = await axiosInstance.delete(`/admin/staff/${staffId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete staff' };
    }
  },
};

export default staffService;
