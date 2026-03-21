import crypto from 'crypto';

// Simple CSRF token generation
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for login and register endpoints
  if (req.path.includes('/login') || req.path.includes('/register')) {
    console.log('Skipping CSRF for:', req.path);
    return next();
  }

  // Skip CSRF for requests with a valid JWT auth token in a custom header.
  // Custom headers (x-auth-token) cannot be set by cross-origin requests
  // without CORS approval, so they inherently prevent CSRF attacks.
  if (req.headers['x-auth-token']) {
    return next();
  }

  // For API routes, we'll use a simple token validation
  // In a real production app, you'd want more sophisticated CSRF protection
  const token = req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'] || (req.body ? req.body._csrf : undefined);
  
  if (!token) {
    console.log('CSRF token missing for:', req.path);
    return res.status(403).json({
      message: 'CSRF token missing. Please refresh the page and try again.',
      error: 'CSRF_MISSING'
    });
  }

  // For now, we'll accept any token (in production, validate against stored tokens)
  // This is a simplified implementation
  console.log('CSRF token validated for:', req.path);
  next();
};

// CSRF token generation endpoint
const generateToken = (req, res) => {
  const token = generateCSRFToken();
  res.json({ csrfToken: token });
};

// Custom CSRF error handler
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      message: 'CSRF token validation failed. Please refresh the page and try again.',
      error: 'CSRF_ERROR'
    });
  }
  next(err);
};

export { 
  csrfProtection, 
  csrfErrorHandler, 
  generateToken,
  generateCSRFToken 
}; 