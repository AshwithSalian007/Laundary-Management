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

      // Check if response has admin data
      if (!response.admin) {
        throw new Error('Invalid response from server.');
      }

      // Save admin data and token
      login(response.admin, response.token);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
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
