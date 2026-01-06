import api from '../../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  // Student login
  login: async (email, password) => {
    try {
      const response = await api.post('/admin/student/login', {
        email,
        password,
      });

      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.student));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Student logout
  logout: async () => {
    try {
      // Call logout API to remove session from Redis
      await api.post('/admin/student/logout');
    } catch (error) {
      // Continue with local logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      // Always clear local storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
  },

  // Get current user from storage
  getCurrentUser: async () => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  },
};
