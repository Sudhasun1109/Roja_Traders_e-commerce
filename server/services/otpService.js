const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);

/**
 * Format and validate mobile number
 * Accepts formats: 9876543210, +919876543210, 919876543210
 * Standardizes to +91XXXXXXXXXX (or user country code if supplied)
 */
function normalizeMobileNumber(rawMobile, countryCode = '+91') {
  if (!rawMobile) return null;
  let cleaned = String(rawMobile).trim().replace(/[\s\-()]/g, '');

  if (cleaned.startsWith('+')) {
    // Already has +
    return cleaned;
  }

  // If starts with 91 and has 12 digits total
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }

  // If 10 digits
  if (cleaned.length === 10) {
    const code = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
    return `${code}${cleaned}`;
  }

  // Fallback
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

function isValidMobileNumber(mobile) {
  // Matches + followed by 10 to 15 digits
  return /^\+[1-9]\d{9,14}$/.test(mobile);
}

/**
 * Generate 6-digit cryptographic OTP
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create and store hashed OTP in database
 */
async function createAndSendOTP(mobileNumber) {
  const otp = generateOTP();
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otp, salt);

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any previously unverified OTPs for this mobile
  await pool.execute(
    'DELETE FROM otp_verifications WHERE mobile_number = ? AND verified = FALSE',
    [mobileNumber]
  );

  // Store new OTP hash
  await pool.execute(
    'INSERT INTO otp_verifications (mobile_number, otp_hash, expires_at, verified) VALUES (?, ?, ?, FALSE)',
    [mobileNumber, otpHash, expiresAt]
  );

  // Logging for dev / mock mode
  console.log(`\n========================================`);
  console.log(`📱 SMS OTP DISPATCH: ${mobileNumber}`);
  console.log(`🔑 Verification Code: ${otp}`);
  console.log(`⏳ Expires in: ${OTP_EXPIRY_MINUTES} minutes`);
  console.log(`========================================\n`);

  return {
    otpSent: true,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
    // Return debugOtp only in non-production/mock mode for effortless testing
    debugOtp: process.env.SMS_PROVIDER_MODE !== 'production' ? otp : undefined
  };
}

/**
 * Verify OTP against stored hash
 */
async function verifyOTP(mobileNumber, enteredOtp) {
  const [rows] = await pool.execute(
    'SELECT * FROM otp_verifications WHERE mobile_number = ? AND verified = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
    [mobileNumber]
  );

  if (!rows || rows.length === 0) {
    return {
      valid: false,
      message: 'Invalid or expired OTP. Please request a new code.'
    };
  }

  const record = rows[0];
  const isMatch = await bcrypt.compare(String(enteredOtp).trim(), record.otp_hash);

  if (!isMatch) {
    return {
      valid: false,
      message: 'Incorrect OTP. Please enter the 6-digit code sent to your phone.'
    };
  }

  // Mark record as verified
  await pool.execute('UPDATE otp_verifications SET verified = TRUE WHERE id = ?', [record.id]);

  return {
    valid: true,
    message: 'OTP verified successfully'
  };
}

module.exports = {
  normalizeMobileNumber,
  isValidMobileNumber,
  generateOTP,
  createAndSendOTP,
  verifyOTP
};
