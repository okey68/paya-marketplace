/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP code
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Get OTP expiration time (10 minutes from now)
 * @returns {Date} Expiration timestamp
 */
const getOTPExpiration = () => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

module.exports = {
  generateOTP,
  getOTPExpiration
};
