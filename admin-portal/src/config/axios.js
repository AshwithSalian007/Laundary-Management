import axios from 'axios';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - auto logout (session expired or invalid token)
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || 'Session expired';

      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login
      window.location.href = '/login';

      // Prevent further error propagation
      return Promise.reject({
        message: errorMessage,
        isAuthError: true,
      });
    }

    // Handle 503 Service Unavailable (Redis down)
    if (error.response?.status === 503) {
      return Promise.reject({
        message: error.response?.data?.message || 'Service temporarily unavailable. Please try again.',
      });
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your connection.',
      });
    }

    // Return the error for component-level handling
    return Promise.reject(error);
  }
);

export default axiosInstance;
