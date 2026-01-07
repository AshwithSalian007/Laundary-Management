import React, { createContext, useState, useContext, useEffect } from 'react';
import * as authService from '../services/authService';

// Create Auth Context
const AuthContext = createContext({});

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Check if user is authenticated and load user data
   */
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);

      // Get token and user data from secure storage
      const token = await authService.getToken();
      const userData = await authService.getUser();

      if (token && userData) {
        // Verify token with backend
        const isValid = await authService.verifyToken();

        if (isValid) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Token invalid - clear everything
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Login result
   */
  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);

      if (result.success) {
        setUser(result.student);
        setIsAuthenticated(true);
      }

      return result;
    } catch (error) {
      console.error('Login error in context:', error);
      throw error;
    }
  };

  /**
   * Logout user - Clear session and storage
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  /**
   * Update user data in context and storage
   * @param {Object} userData - Updated user data
   */
  const updateUser = async (userData) => {
    try {
      setUser(userData);
      // Also update in secure storage
      await authService.setUser(userData);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
