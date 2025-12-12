import axiosInstance from '../../../config/axios';

const roleService = {
  // Get all roles
  getAllRoles: async () => {
    try {
      const response = await axiosInstance.get('/admin/roles');
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to fetch roles' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Get all permissions
  getAllPermissions: async () => {
    try {
      const response = await axiosInstance.get('/admin/permissions');
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to fetch permissions' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Create new role
  createRole: async (roleData) => {
    try {
      const response = await axiosInstance.post('/admin/roles', roleData);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to create role' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Update role permissions
  updateRolePermissions: async (roleId, permissionIds) => {
    try {
      const response = await axiosInstance.put(`/admin/roles/${roleId}`, { permissionIds });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to update role permissions' };
      throw { ...errorData, status: error.response?.status };
    }
  },

  // Delete role
  deleteRole: async (roleId) => {
    try {
      const response = await axiosInstance.delete(`/admin/roles/${roleId}`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to delete role' };
      throw { ...errorData, status: error.response?.status };
    }
  },
};

export default roleService;
