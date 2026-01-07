import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Base API URL - Update this with your backend URL
const API_BASE_URL = 'http://172.17.1.32:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from SecureStore:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      // Handle specific error cases
      if (status === 401) {
        // Unauthorized - Token invalid or expired
        console.log('Unauthorized - clearing token and user data');
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('userData');
        // Token cleared - user will be redirected to login
      } else if (status === 403) {
        // Forbidden - Account deactivated or logged in elsewhere
        console.log('Forbidden - account issue');
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('userData');
      }

      // Return formatted error
      return Promise.reject({
        status,
        message: data.message || 'An error occurred',
        data: data,
      });
    } else if (error.request) {
      // Request made but no response received
      return Promise.reject({
        message: 'Network error. Please check your connection.',
      });
    } else {
      // Something else happened
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
      });
    }
  }
);

export default api;
export { API_BASE_URL };
