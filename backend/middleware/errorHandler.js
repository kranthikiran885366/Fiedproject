const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Insufficient permissions'
    });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: err.message
    });
  }

  // Handle database errors
  if (err.name === 'MongoError') {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate Entry',
        message: 'A record with this information already exists'
      });
    }
  }

  // Handle file system errors
  if (err.code === 'ENOENT') {
    return res.status(404).json({
      success: false,
      error: 'File Not Found',
      message: 'The requested resource could not be found'
    });
  }

  // Handle camera/stream errors
  if (err.name === 'StreamError') {
    return res.status(503).json({
      success: false,
      error: 'Stream Error',
      message: 'Error accessing camera stream'
    });
  }

  // Handle face detection errors
  if (err.name === 'FaceDetectionError') {
    return res.status(500).json({
      success: false,
      error: 'Face Detection Error',
      message: 'Error processing face detection'
    });
  }

  // Default error handler
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
};

module.exports = errorHandler; 