const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { errorResponse } = require('../utils/responseHelper');

/**
 * Admin authentication middleware
 * Validates admin JWT token against ADMIN_JWT_SECRET
 */
async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Admin authentication required. Access denied.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET || 'admin_jwt_secret_key_whatsapp_showcase_2026'
    );

    if (!decoded || !decoded.adminId) {
      return errorResponse(res, 'Invalid admin token credentials', 401);
    }

    const [rows] = await pool.execute(
      'SELECT id, username, role FROM admins WHERE id = ?',
      [decoded.adminId]
    );

    if (!rows || rows.length === 0) {
      return errorResponse(res, 'Admin account not found', 401);
    }

    req.admin = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Admin session expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Unauthorized admin access', 401);
  }
}

module.exports = {
  authenticateAdmin
};
