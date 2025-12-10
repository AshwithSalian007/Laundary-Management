import { useState } from 'react';
import { Input, Button } from '../../../shared/components';
import useLogin from '../hooks/useLogin';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const { loading, error, handleLogin } = useLogin();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      await handleLogin(formData.email, formData.password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7F6] px-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#228B22] rounded-lg mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {/* Washing Machine Icon */}
                <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth="2"/>
                <circle cx="12" cy="14" r="5" strokeWidth="2"/>
                <circle cx="12" cy="14" r="3" strokeWidth="2"/>
                <circle cx="7" cy="6" r="0.5" fill="currentColor" strokeWidth="1.5"/>
                <circle cx="10" cy="6" r="0.5" fill="currentColor" strokeWidth="1.5"/>
                <line x1="14" y1="6" x2="17" y2="6" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1F2937] mb-2">
              SmartWash Admin
            </h1>
            <p className="text-sm text-[#6B7280]">
              Sign in to your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@smartwash.com"
                disabled={loading}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22] focus:border-transparent transition ${
                  formErrors.email
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-[#E0E0E0]'
                } disabled:bg-gray-50`}
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={loading}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22] focus:border-transparent transition ${
                  formErrors.password
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-[#E0E0E0]'
                } disabled:bg-gray-50`}
              />
              {formErrors.password && (
                <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#228B22] hover:bg-[#4CAF50] text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#6B7280]">
              Admin and staff access only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
