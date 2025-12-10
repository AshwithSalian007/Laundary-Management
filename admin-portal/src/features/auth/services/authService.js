import axiosInstance from '../../../config/axios';

const authService = {
  // Login function
  login: async (email, password) => {
    try {
      const response = await axiosInstance.post('/admin/login', {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await axiosInstance.get('/admin/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch profile' };
    }
  },

  // Logout function (if backend has logout endpoint)
  logout: async () => {
    try {
      const response = await axiosInstance.post('/admin/logout');
      return response.data;
    } catch (error) {
      // Even if logout fails on backend, we clear local storage
      throw error.response?.data || { message: 'Logout failed' };
    }
  },
};

export default authService;
