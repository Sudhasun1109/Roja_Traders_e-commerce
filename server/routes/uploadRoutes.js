const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const handleSingleUpload = (req, res) => {
  if (!req.file) {
    return errorResponse(res, 'No image file uploaded', 400);
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  return successResponse(
    res,
    {
      url: fileUrl,
      imageUrl: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    },
    'Image uploaded successfully'
  );
};

// Admin image upload (Single file) - Support both POST /api/upload and POST /api/upload/single
router.post('/', uploadLimiter, authenticateAdmin, upload.single('image'), handleSingleUpload);
router.post('/single', uploadLimiter, authenticateAdmin, upload.single('image'), handleSingleUpload);

// Admin image upload (Multiple files, up to 5)
router.post('/multiple', uploadLimiter, authenticateAdmin, upload.array('images', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return errorResponse(res, 'No image files uploaded', 400);
  }
  const files = req.files.map((f) => ({
    url: `/uploads/${f.filename}`,
    imageUrl: `/uploads/${f.filename}`,
    filename: f.filename,
    size: f.size
  }));
  return successResponse(res, { files }, 'Images uploaded successfully');
});

module.exports = router;
