import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(email, password);

      // Check if response has token
      if (!response.token) {
        throw new Error('Invalid response from server.');
      }

      // Store token first (needed for /me endpoint)
      localStorage.setItem('token', response.token);

      // Fetch fresh user data from /me endpoint to get correct permissions format
      const profileResponse = await authService.getProfile();

      if (!profileResponse.admin) {
        throw new Error('Failed to fetch user profile.');
      }

      // Save admin data with correct permissions format
      login(profileResponse.admin, response.token);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      // Clean up token on error
      localStorage.removeItem('token');

      // Set user-friendly error message
      const errorMessage = err.message || err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);

      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleLogin,
  };
};

export default useLogin;
