import AppError from '../utils/AppError.js';

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err, // Send full error details in development
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

  // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log the error
    console.error('ERROR 💥', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

const errorHandler = (err, req, res, next) => {
  // If headers are already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err }; // Create a copy of the error object
    error.message = err.message; // Ensure the message property is copied

    if (err.name === 'CastError') {
      error = new AppError(`Invalid ${err.path}: ${err.value}.`, 400);
    }
    if (err.code === 11000) {
      error = new AppError('Duplicate field value, please use another value.', 400);
    }
    if (err.name === 'ValidationError') {
      error = new AppError(err.message, 400);
    }
    if (err.name === 'JsonWebTokenError') {
      error = new AppError('Invalid token, please log in again.', 401);
    }
    if (err.name === 'TokenExpiredError') {
      error = new AppError('Your token has expired, please log in again.', 401);
    }

    sendErrorProd(error, res);
  }
};

export default errorHandler;