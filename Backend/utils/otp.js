const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const OTP_LENGTH = 6;
const DEFAULT_EXPIRY_MINUTES = 10;
const DEFAULT_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

/**
 * Generate a cryptographically secure 6-digit numeric OTP
 * Never fixed to 123456.
 * @returns {string} 6-digit OTP string
 */
const generateOtp = () => {
  // Generates integer between 100000 and 999999 inclusive
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Hash an OTP before storing in database
 * @param {string} otp
 * @returns {Promise<string>}
 */
const hashOtp = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(otp, salt);
};

/**
 * Compare entered OTP against hashed OTP in database
 * @param {string} enteredOtp
 * @param {string} hashedOtp
 * @returns {Promise<boolean>}
 */
const compareOtp = async (enteredOtp, hashedOtp) => {
  if (!enteredOtp || !hashedOtp) return false;
  return await bcrypt.compare(enteredOtp, hashedOtp);
};

/**
 * Calculate expiry date from now
 * @param {number} minutes
 * @returns {Date}
 */
const getOtpExpiryDate = (minutes = null) => {
  const mins = minutes || Number(process.env.OTP_EXPIRY_MINUTES) || DEFAULT_EXPIRY_MINUTES;
  return new Date(Date.now() + mins * 60 * 1000);
};

/**
 * Check if the cooldown period is still active
 * @param {Date} lastSentAt
 * @param {number} cooldownSeconds
 * @returns {{ active: boolean, remainingSeconds: number }}
 */
const checkCooldown = (lastSentAt, cooldownSeconds = null) => {
  if (!lastSentAt) {
    return { active: false, remainingSeconds: 0 };
  }

  const cooldown =
    cooldownSeconds ||
    Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) ||
    DEFAULT_COOLDOWN_SECONDS;

  const elapsedMs = Date.now() - new Date(lastSentAt).getTime();
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  if (elapsedSeconds < cooldown) {
    return {
      active: true,
      remainingSeconds: cooldown - elapsedSeconds,
    };
  }

  return { active: false, remainingSeconds: 0 };
};

/**
 * Check if OTP has expired
 * @param {Date} expiresAt
 * @returns {boolean}
 */
const isOtpExpired = (expiresAt) => {
  if (!expiresAt) return true;
  return new Date() > new Date(expiresAt);
};

module.exports = {
  generateOtp,
  hashOtp,
  compareOtp,
  getOtpExpiryDate,
  checkCooldown,
  isOtpExpired,
  MAX_ATTEMPTS,
};
