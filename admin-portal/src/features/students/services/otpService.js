import axiosInstance from '../../../config/axios';

const otpService = {
  /**
   * Send email verification OTP
   * Note: Verification happens during student creation, not as a separate step
   * @param {string} email - Email address to send OTP to
   * @returns {Promise} API response
   */
  sendVerificationOTP: async (email) => {
    const response = await axiosInstance.post('/otp/send-verification', { email });
    return response.data;
  },
};

export default otpService;
