const { errorResponse } = require('../utils/responseHelper');

function errorHandler(err, req, res, next) {
  console.error('Unhandled Application Error:', err);

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'Uploaded image is too large. Maximum size is 5MB.', 400);
    }
    return errorResponse(res, `File upload error: ${err.message}`, 400);
  }

  // MySQL specific errors
  if (err.code === 'ER_DUP_ENTRY') {
    return errorResponse(res, 'A record with these unique details already exists.', 409);
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return errorResponse(res, 'Cannot delete or alter this record because it is referenced by other items.', 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, message, statusCode);
}

module.exports = errorHandler;
