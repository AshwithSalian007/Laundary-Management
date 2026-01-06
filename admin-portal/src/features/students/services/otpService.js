import axiosInstance from '../../../config/axios';

const otpService = {
  /**
   * Send email verification OTP
   * @param {string} email - Email address to send OTP to
   * @param {boolean} createWashPlan - Whether to create wash plan after verification
   * @returns {Promise} API response
   */
  sendVerificationOTP: async (email, createWashPlan = false) => {
    const response = await axiosInstance.post('/otp/send-verification', { email, createWashPlan });
    return response.data;
  },

  /**
   * Verify email with OTP
   * @param {Object} data - Verification data
   * @param {string} data.email - Email address
   * @param {string} data.otp - 6-digit OTP code
   * @param {string} data.password - Plain password to send in welcome email
   * @returns {Promise} API response
   */
  verifyEmailOTP: async (data) => {
    const response = await axiosInstance.post('/otp/verify-email', data);
    return response.data;
  },
};

export default otpService;
