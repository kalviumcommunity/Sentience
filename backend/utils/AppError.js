class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message) {
    return new AppError(message, 400);
  }

  static unauthorized(message) {
    return new AppError(message || 'Unauthorized access', 401);
  }

  static forbidden(message) {
    return new AppError(message || 'Forbidden access', 403);
  }

  static notFound(message) {
    return new AppError(message || 'Resource not found', 404);
  }

  static tooManyRequests(message) {
    return new AppError(message || 'Too many requests', 429);
  }

  static internal(message) {
    return new AppError(message || 'Internal server error', 500);
  }
}

export default AppError;