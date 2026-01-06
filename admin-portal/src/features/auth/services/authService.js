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
      // Handle different error scenarios
      if (error.message === 'Network error. Please check your connection.') {
        throw new Error('Cannot connect to server. Please ensure the backend is running.');
      }

      // Check for backend error message (401, 403, etc.)
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      // Check for custom error message from interceptor
      if (error.message) {
        throw new Error(error.message);
      }

      throw new Error('Login failed. Please try again.');
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
