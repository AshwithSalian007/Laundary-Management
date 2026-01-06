import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Session invalid - clear local storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      // Enhance error message based on code
      const errorData = error.response?.data;
      if (errorData?.code === 'SESSION_NOT_FOUND') {
        error.response.data.message = 'Session expired or logged in on another device. Please login again.';
      } else if (errorData?.code === 'ACCOUNT_NOT_FOUND') {
        error.response.data.message = 'Account not found. Please contact administration.';
      } else if (errorData?.code === 'ACCOUNT_DEACTIVATED') {
        error.response.data.message = 'Your account has been deactivated by administration.';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
