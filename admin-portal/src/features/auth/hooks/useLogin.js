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

      // Check if user is admin or staff
      if (response.user.role !== 'admin' && response.user.role !== 'staff') {
        throw new Error('Access denied. Admin or staff credentials required.');
      }

      // Save user data and token
      login(response.user, response.token);

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
