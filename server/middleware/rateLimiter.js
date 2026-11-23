const rateLimit = require('express-rate-limit');

/**
 * General Public API Rate Limiter
 * Applied across public storefront APIs (products, categories, banners, settings)
 * Skips /api/admin paths so admin management workflows have their own dedicated capacity.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes per IP
  skip: (req) => req.originalUrl.startsWith('/api/admin'),
  message: {
    success: false,
    message: 'Too many requests from this device. Please wait a few moments before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Dedicated Admin API Rate Limiter
 * Applied to authenticated admin routes (/api/admin/*)
 * Allows high request volume (3000 requests / 15 mins) for real-time dashboards, pagination & updates
 */
const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000,
  message: {
    success: false,
    message: 'Admin activity rate limit reached. Please slow down and try again in a few moments.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Admin Login Rate Limiter
 * Applied strictly to /api/admin/login to prevent brute-force credential stuffing
 */
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many admin login attempts from this IP. Please wait 15 minutes before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Customer OTP Send Rate Limiter
 * Applied to /api/auth/send-otp to prevent SMS/OTP spamming
 */
const otpRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes window
  max: 6, // 6 OTP requests per 5 minutes per IP
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait a few minutes before requesting another OTP.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Customer OTP Verify Rate Limiter
 * Applied to /api/auth/verify-otp to prevent brute-force code guessing
 */
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // 15 attempts per 10 minutes
  message: {
    success: false,
    message: 'Too many verification attempts. Please wait a few minutes or request a new OTP.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * WhatsApp Order & Enquiry Rate Limiter
 * Applied to /api/enquiries to prevent fake order flooding
 */
const enquiryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // 30 orders/enquiries per 10 minutes
  message: {
    success: false,
    message: 'Order submission rate limit exceeded. Please wait a moment before sending another enquiry.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * File & Poster Image Upload Rate Limiter
 * Applied to /api/upload
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 file uploads per 15 mins
  message: {
    success: false,
    message: 'Upload limit reached. Please wait a few minutes before uploading additional files.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  adminApiLimiter,
  adminLoginLimiter,
  otpRateLimiter,
  otpVerifyLimiter,
  enquiryLimiter,
  uploadLimiter
};
