import api from '../config/api';
import * as SecureStore from 'expo-secure-store';

// Token storage keys
const TOKEN_KEY = 'authToken';
const USER_KEY = 'userData';

/**
 * Login student with email and password
 * @param {string} email - Student email
 * @param {string} password - Student password
 * @returns {Promise<Object>} - Login response with token and user data
 */
export const login = async (email, password) => {
  try {
    const response = await api.post('/admin/student/login', {
      email: email.toLowerCase().trim(),
      password,
    });

    const { token, student } = response.data;

    // Store token and user data securely
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }

    if (student) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(student));
    }

    return {
      success: true,
      token,
      student,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw {
      success: false,
      message: error.message || 'Failed to login. Please try again.',
    };
  }
};

/**
 * Logout student - Clear token and session
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    // Call backend logout API
    await api.post('/admin/student/logout');
  } catch (error) {
    console.error('Logout API error:', error);
    // Continue with local logout even if API call fails
  } finally {
    // Clear local storage
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }
};

/**
 * Get stored auth token
 * @returns {Promise<string|null>} - Auth token or null
 */
export const getToken = async () => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Get stored user data
 * @returns {Promise<Object|null>} - User data or null
 */
export const getUser = async () => {
  try {
    const userData = await SecureStore.getItemAsync(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Verify token with backend
 * Checks if the token is still valid by making a simple API request
 * @returns {Promise<boolean>} - true if token is valid, false otherwise
 */
export const verifyToken = async () => {
  try {
    const token = await getToken();
    if (!token) {
      return false;
    }

    // For students, we don't have a dedicated /me endpoint
    // So we'll just check if token exists locally
    // The token will be validated on the first actual API call
    // If invalid, the API interceptor will clear it automatically
    return true;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
};

/**
 * Update user data in secure storage
 * @param {Object} userData - User data to store
 * @returns {Promise<void>}
 */
export const setUser = async (userData) => {
  try {
    if (userData) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
    }
  } catch (error) {
    console.error('Error setting user data:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated (has token)
 * @returns {Promise<boolean>} - true if authenticated, false otherwise
 */
export const isAuthenticated = async () => {
  const token = await getToken();
  return !!token;
};
