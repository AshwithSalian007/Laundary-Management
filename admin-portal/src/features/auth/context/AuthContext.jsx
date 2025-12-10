import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate session on page refresh
    const validateSession = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (storedUser && token) {
        try {
          // Call /me endpoint to verify Redis session is still valid
          const response = await authService.getProfile();

          // Update user with fresh data from Redis
          if (response.success && response.admin) {
            setUser(response.admin);
            localStorage.setItem('user', JSON.stringify(response.admin));
          } else {
            // Invalid response, clear storage
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
          }
        } catch (error) {
          // Session expired or invalid - axios interceptor will handle redirect
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        }
      }

      setLoading(false);
    };

    validateSession();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
