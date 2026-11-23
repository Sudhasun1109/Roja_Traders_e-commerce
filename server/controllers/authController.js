const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const {
  normalizeMobileNumber,
  isValidMobileNumber,
  createAndSendOTP,
  verifyOTP
} = require('../services/otpService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * Validate strong password criteria:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * - At least 1 special character
 */
function validatePasswordRules(password) {
  if (!password || typeof password !== 'string') return false;
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return minLength && hasUpper && hasNumber && hasSpecial;
}

/**
 * Send OTP to customer mobile number
 * POST /api/auth/send-otp
 */
async function sendOtp(req, res, next) {
  try {
    const { mobileNumber, countryCode = '+91' } = req.body;

    if (!mobileNumber) {
      return errorResponse(res, 'Mobile number is required', 400);
    }

    const normalized = normalizeMobileNumber(mobileNumber, countryCode);

    if (!isValidMobileNumber(normalized)) {
      return errorResponse(
        res,
        'Please provide a valid mobile number (e.g. 10 digits for India or international format)',
        400
      );
    }

    // Check if user exists and is inactive
    const [existing] = await pool.execute('SELECT * FROM users WHERE mobile_number = ?', [normalized]);
    if (existing.length > 0 && existing[0].status === 'inactive') {
      return errorResponse(res, 'Your account has been deactivated. Please contact support.', 403);
    }

    const otpResult = await createAndSendOTP(normalized);

    return successResponse(
      res,
      {
        mobileNumber: normalized,
        expiresInMinutes: otpResult.expiresInMinutes,
        debugOtp: otpResult.debugOtp
      },
      'OTP sent successfully to your mobile number'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Verify OTP and log in / auto-register customer
 * POST /api/auth/verify-otp
 */
async function verifyOtp(req, res, next) {
  try {
    const { mobileNumber, countryCode = '+91', otp, name } = req.body;

    if (!mobileNumber || !otp) {
      return errorResponse(res, 'Mobile number and OTP are required', 400);
    }

    const normalized = normalizeMobileNumber(mobileNumber, countryCode);

    const verification = await verifyOTP(normalized, otp);
    if (!verification.valid) {
      return errorResponse(res, verification.message, 400);
    }

    // Check if user exists
    const [rows] = await pool.execute('SELECT * FROM users WHERE mobile_number = ?', [normalized]);
    let user;

    if (rows.length === 0) {
      // Auto-register new customer
      const customerName = name && name.trim() ? name.trim() : 'Customer';
      const [insertResult] = await pool.execute(
        'INSERT INTO users (name, mobile_number, is_verified, status) VALUES (?, ?, TRUE, "active")',
        [customerName, normalized]
      );
      user = {
        id: insertResult.insertId,
        name: customerName,
        mobile_number: normalized,
        is_verified: 1,
        status: 'active'
      };
    } else {
      user = rows[0];
      if (user.status !== 'active') {
        return errorResponse(res, 'Account is deactivated', 403);
      }
      // If name was provided and currently default or user wants to update it
      if (name && name.trim()) {
        await pool.execute('UPDATE users SET name = ?, is_verified = TRUE WHERE id = ?', [name.trim(), user.id]);
        user.name = name.trim();
      } else if (!user.is_verified) {
        await pool.execute('UPDATE users SET is_verified = TRUE WHERE id = ?', [user.id]);
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, mobileNumber: user.mobile_number },
      process.env.JWT_SECRET || 'customer_jwt_secret_key_whatsapp_showcase_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return successResponse(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          mobile_number: user.mobile_number,
          is_verified: true
        },
        token
      },
      'Mobile number verified successfully'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Get current customer profile
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
  try {
    return successResponse(res, { user: req.user }, 'User profile retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * Update customer name
 * PUT /api/auth/profile
 */
async function updateProfile(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return errorResponse(res, 'Name cannot be empty', 400);
    }

    await pool.execute('UPDATE users SET name = ? WHERE id = ?', [name.trim(), req.user.id]);
    req.user.name = name.trim();

    return successResponse(res, { user: req.user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Customer Logout
 * POST /api/auth/logout
 */
async function logout(req, res, next) {
  try {
    return successResponse(res, {}, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Register a new customer with Mobile Number + Password
 * Strict duplicate mobile number prevention against database!
 * POST /api/auth/register
 */
async function registerCustomer(req, res, next) {
  try {
    const { name, mobileNumber, countryCode = '+91', password } = req.body;

    if (!mobileNumber) {
      return errorResponse(res, 'Mobile number is required', 400);
    }

    if (!password) {
      return errorResponse(res, 'Password is required', 400);
    }

    const normalized = normalizeMobileNumber(mobileNumber, countryCode);

    if (!isValidMobileNumber(normalized)) {
      return errorResponse(
        res,
        'Please enter a valid mobile number (e.g. 10 digits for India)',
        400
      );
    }

    // 1. Check if mobile number already exists in DB
    const [existing] = await pool.execute('SELECT id, status FROM users WHERE mobile_number = ?', [normalized]);
    if (existing.length > 0) {
      return errorResponse(
        res,
        'This mobile number is already registered in our store. Please login or reset your password.',
        409
      );
    }

    // 2. Validate password rules
    if (!validatePasswordRules(password)) {
      return errorResponse(
        res,
        'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 number, and 1 special character.',
        400
      );
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const customerName = name && name.trim() ? name.trim() : 'Customer';

    // 4. Insert into database
    const [result] = await pool.execute(
      'INSERT INTO users (name, mobile_number, password, is_verified, status) VALUES (?, ?, ?, TRUE, "active")',
      [customerName, normalized, hashedPassword]
    );

    const user = {
      id: result.insertId,
      name: customerName,
      mobile_number: normalized,
      is_verified: true,
      status: 'active'
    };

    const token = jwt.sign(
      { userId: user.id, mobileNumber: user.mobile_number },
      process.env.JWT_SECRET || 'customer_jwt_secret_key_whatsapp_showcase_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return successResponse(
      res,
      { user, token },
      'Registration successful! Welcome to Roja Traders.',
      201
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Customer Login with Mobile Number + Password
 * POST /api/auth/login
 */
async function loginCustomer(req, res, next) {
  try {
    const { mobileNumber, countryCode = '+91', password } = req.body;

    if (!mobileNumber || !password) {
      return errorResponse(res, 'Mobile number and password are required', 400);
    }

    const normalized = normalizeMobileNumber(mobileNumber, countryCode);

    const [rows] = await pool.execute('SELECT * FROM users WHERE mobile_number = ?', [normalized]);
    if (rows.length === 0) {
      return errorResponse(res, 'Mobile number not found. Please create an account or verify your number.', 404);
    }

    const user = rows[0];

    if (user.status !== 'active') {
      return errorResponse(res, 'Your account is deactivated. Please contact support.', 403);
    }

    // Check password
    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch && password !== user.password) {
        return errorResponse(res, 'Incorrect password. Please try again or use Forgot Password.', 401);
      }
    } else {
      // Legacy user who hasn't set a password yet: set it on first login
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
    }

    const token = jwt.sign(
      { userId: user.id, mobileNumber: user.mobile_number },
      process.env.JWT_SECRET || 'customer_jwt_secret_key_whatsapp_showcase_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return successResponse(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          mobile_number: user.mobile_number,
          is_verified: !!user.is_verified
        },
        token
      },
      'Logged in successfully!'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Request Password Reset (Step 1: Check mobile in DB and send OTP)
 * POST /api/auth/forgot-password/request
 */
async function requestForgotPassword(req, res, next) {
  try {
    const { mobileNumber, countryCode = '+91' } = req.body;

    if (!mobileNumber) {
      return errorResponse(res, 'Mobile number is required', 400);
    }

    const normalized = normalizeMobileNumber(mobileNumber, countryCode);

    // Verify user exists in database
    const [rows] = await pool.execute('SELECT id, name, status FROM users WHERE mobile_number = ?', [normalized]);
    if (rows.length === 0) {
      return errorResponse(
        res,
        'This mobile number is not registered. Please create a new account.',
        404
      );
    }

    const user = rows[0];
    if (user.status !== 'active') {
      return errorResponse(res, 'Your account is deactivated. Please contact support.', 403);
    }

    // Generate and send OTP for verification
    const otpResult = await createAndSendOTP(normalized);

    return successResponse(
      res,
      {
        mobileNumber: normalized,
        userName: user.name,
        expiresInMinutes: otpResult.expiresInMinutes,
        debugOtp: otpResult.debugOtp
      },
      'Verification OTP sent to your registered mobile number'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Reset Password (Step 2: Verify OTP and save new password with strict validation)
 * POST /api/auth/forgot-password/reset
 */
async function resetForgotPassword(req, res, next) {
  try {
    const { mobileNumber, countryCode = '+91', otp, newPassword } = req.body;

    if (!mobileNumber || !otp || !newPassword) {
      return errorResponse(res, 'Mobile number, OTP, and new password are required', 400);
    }

    const normalized = normalizeMobileNumber(mobileNumber, countryCode);

    // 1. Verify OTP
    const verification = await verifyOTP(normalized, otp);
    if (!verification.valid) {
      return errorResponse(res, verification.message || 'Invalid or expired OTP', 400);
    }

    // 2. Validate new password rules (8 chars, 1 uppercase, 1 number, 1 special char)
    if (!validatePasswordRules(newPassword)) {
      return errorResponse(
        res,
        'New password must be at least 8 characters long and contain at least 1 uppercase letter, 1 number, and 1 special character.',
        400
      );
    }

    // 3. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update in database
    const [updateResult] = await pool.execute(
      'UPDATE users SET password = ?, is_verified = TRUE WHERE mobile_number = ?',
      [hashedPassword, normalized]
    );

    if (updateResult.affectedRows === 0) {
      return errorResponse(res, 'User account not found', 404);
    }

    return successResponse(
      res,
      { mobileNumber: normalized },
      'Password updated successfully! Please login with your new password.'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Verify Mobile for Forgot Password (NO OTP - directly checks if mobile exists in DB)
 * POST /api/auth/forgot-password/verify-mobile
 */
async function verifyForgotPasswordMobile(req, res, next) {
  try {
    const { mobileNumber, countryCode = '+91' } = req.body;

    if (!mobileNumber) {
      return errorResponse(res, 'Mobile number is required', 400);
    }

    const normalized = normalizeMobileNumber(mobileNumber, countryCode);

    // Verify user exists in database
    const [rows] = await pool.execute('SELECT id, name, status FROM users WHERE mobile_number = ?', [normalized]);
    if (rows.length === 0) {
      return errorResponse(
        res,
        'This mobile number is not registered. Please create a new account.',
        404
      );
    }

    const user = rows[0];
    if (user.status !== 'active') {
      return errorResponse(res, 'Your account is deactivated. Please contact support.', 403);
    }

    return successResponse(
      res,
      {
        mobileNumber: normalized,
        userName: user.name
      },
      'Mobile number verified successfully. Please enter your new password.'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Direct Change Password (NO OTP required - directly updates password after mobile check)
 * POST /api/auth/forgot-password/change
 */
async function changePasswordDirect(req, res, next) {
  try {
    const { mobileNumber, countryCode = '+91', newPassword } = req.body;

    if (!mobileNumber || !newPassword) {
      return errorResponse(res, 'Mobile number and new password are required', 400);
    }

    const normalized = normalizeMobileNumber(mobileNumber, countryCode);

    // 1. Verify user exists in database
    const [rows] = await pool.execute('SELECT id, name, status FROM users WHERE mobile_number = ?', [normalized]);
    if (rows.length === 0) {
      return errorResponse(
        res,
        'This mobile number is not registered. Please create a new account.',
        404
      );
    }

    // 2. Validate new password rules (8 chars, 1 uppercase, 1 number, 1 special char)
    if (!validatePasswordRules(newPassword)) {
      return errorResponse(
        res,
        'New password must be at least 8 characters long and contain at least 1 uppercase letter, 1 number, and 1 special character.',
        400
      );
    }

    // 3. Hash new password with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update in database
    await pool.execute(
      'UPDATE users SET password = ?, is_verified = TRUE WHERE mobile_number = ?',
      [hashedPassword, normalized]
    );

    return successResponse(
      res,
      { mobileNumber: normalized },
      'Password updated successfully! Please login with your new password.'
    );
  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendOtp,
  verifyOtp,
  registerCustomer,
  loginCustomer,
  requestForgotPassword,
  resetForgotPassword,
  verifyForgotPasswordMobile,
  changePasswordDirect,
  getMe,
  updateProfile,
  logout
};
