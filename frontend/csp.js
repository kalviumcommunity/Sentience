// Content Security Policy for enhanced security

// Define CSP directives
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for React development
    "'unsafe-eval'", // Required for Vite development
    'https://api.dicebear.com', // For avatar generation
    'https://sentience-xq1s.onrender.com' // For API calls
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS
    'https://fonts.googleapis.com' // For Google Fonts
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com', // For Google Fonts
    'https://api.dicebear.com' // For avatar generation
  ],
  'img-src': [
    "'self'",
    'data:', // For data URLs
    'https://api.dicebear.com', // For avatar generation
    'https://sentience-xq1s.onrender.com' // For API images
  ],
  'connect-src': [
    "'self'",
    'https://sentience-xq1s.onrender.com', // For API calls
    'https://api.dicebear.com' // For avatar API
  ],
  'frame-src': ["'none'"], // No iframes allowed
  'object-src': ["'none'"], // No objects allowed
  'base-uri': ["'self'"], // Restrict base URI
  'form-action': ["'self'"], // Restrict form submissions
  'frame-ancestors': ["'none'"], // Prevent clickjacking
  'upgrade-insecure-requests': [], // Force HTTPS
  'block-all-mixed-content': [] // Block mixed content
};

// Convert directives to CSP header string
const generateCSP = () => {
  return Object.entries(cspDirectives)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
};

// Apply CSP if in production and document is available
if (typeof document !== 'undefined' && process.env.NODE_ENV === 'production') {
  try {
    const csp = generateCSP();
    
    // Add CSP meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = csp;
    document.head.appendChild(meta);
    
    console.log('Content Security Policy applied:', csp);
  } catch (error) {
    console.warn('Failed to apply CSP:', error);
  }
}

export { generateCSP }; 