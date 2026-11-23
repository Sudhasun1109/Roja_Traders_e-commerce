const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { errorResponse } = require('../utils/responseHelper');

/**
 * Customer authentication middleware
 */
async function authenticateCustomer(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required. Please log in with your mobile number.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'customer_jwt_secret_key_whatsapp_showcase_2026');

    // Fetch user from DB to ensure still active
    const [rows] = await pool.execute(
      'SELECT id, name, mobile_number, role, is_verified, status FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!rows || rows.length === 0) {
      return errorResponse(res, 'User account not found', 401);
    }

    const user = rows[0];
    if (user.status !== 'active') {
      return errorResponse(res, 'User account has been deactivated. Please contact support.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Your session has expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Invalid authentication token', 401);
  }
}

/**
 * Optional customer authentication (attaches user if token is present, does not fail if absent)
 */
async function optionalCustomerAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'customer_jwt_secret_key_whatsapp_showcase_2026');
      const [rows] = await pool.execute(
        'SELECT id, name, mobile_number, role, is_verified, status FROM users WHERE id = ?',
        [decoded.userId]
      );
      if (rows && rows.length > 0 && rows[0].status === 'active') {
        req.user = rows[0];
      }
    }
  } catch (e) {
    // Ignore error for optional auth
  }
  next();
}

module.exports = {
  authenticateCustomer,
  optionalCustomerAuth
};
