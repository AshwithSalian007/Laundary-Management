/**
 * Validation utilities for the application
 */

/**
 * Validate email address
 * Uses a more robust regex that supports:
 * - Standard email formats
 * - Plus addressing (email+tag@domain.com)
 * - TLDs of any length
 * - Subdomains
 *
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // More robust email regex
  // Allows: letters, numbers, dots, hyphens, underscores, plus signs
  // Supports TLDs of 2+ characters
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailRegex.test(email.trim());
};

/**
 * Validate Indian phone number
 * Must be 10 digits starting with 6-9
 *
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidIndianPhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phoneNumber.trim());
};

/**
 * Validate password strength
 * Minimum requirements:
 * - At least 6 characters (configurable)
 *
 * @param {string} password - Password to validate
 * @param {number} minLength - Minimum password length (default: 6)
 * @returns {object} - {isValid: boolean, message: string}
 */
export const validatePassword = (password, minLength = 6) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required',
    };
  }

  if (password.length < minLength) {
    return {
      isValid: false,
      message: `Password must be at least ${minLength} characters`,
    };
  }

  return {
    isValid: true,
    message: 'Password is valid',
  };
};

/**
 * Password validation constants
 */
export const PASSWORD_CONSTRAINTS = {
  MIN_LENGTH: 6,
  MAX_LENGTH: 128,
};

/**
 * Sanitize string input
 * Trims whitespace and converts to lowercase
 *
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.trim().toLowerCase();
};
