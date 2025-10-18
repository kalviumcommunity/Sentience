import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { csrfProtection, csrfErrorHandler, generateToken } from './middleware/csrf.js';

// Import routes
import userRoutes from './routes/userRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import moodRoutes from './routes/moodRoutes.js';
import studyRoutes from './routes/studyRoutes.js';
import focusRoutes from './routes/focusRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Trust proxy (Render/Cloudflare) so rate limiter can use X-Forwarded-For
app.set('trust proxy', 2);

// CORS middleware - must be before other middleware
// CORS middleware
const allowedOrigins = [
  'https://sentiencehub.netlify.app',
  'https://sentience.onrender.com',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:8083',
  'http://localhost:8084',
  'http://localhost:8085'
];
const allowedOriginRegexes = [
  /^https:\/\/deploy-preview-\d+--sentiencehub\.netlify\.app$/
];

app.use(cors({
  origin: (origin, callback) => {
    console.log('CORS Origin check:', origin);
    if (!origin) return callback(null, true); // allow non-browser or same-origin
    if (allowedOrigins.includes(origin) || allowedOriginRegexes.some((re) => re.test(origin))) {
      console.log('CORS Origin allowed:', origin);
      return callback(null, true);
    }
    console.log('CORS Origin rejected:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-csrf-token', 'X-CSRF-Token'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Security middleware
app.use(helmet());

// Rate limiting with memory leak prevention
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Count failed requests
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 60), // minutes
    });
  },
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Body parsing middleware with memory optimization (must run BEFORE CSRF)
app.use(express.json({ 
  limit: '5mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ message: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 seconds
  res.setTimeout(30000); // 30 seconds
  next();
});

// Add CSRF protection to all routes (AFTER body parsers)
app.use('/api/', csrfProtection);

// Add session tracking middleware with memory cleanup
const activeSessions = new Map();
const SESSION_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Clean up old sessions periodically
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [token, timestamp] of activeSessions.entries()) {
    if (now - timestamp > 24 * 60 * 60 * 1000) { // 24 hours
      activeSessions.delete(token);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
  }
}, SESSION_CLEANUP_INTERVAL);

app.use('/api/', (req, res, next) => {
  const token = req.headers['x-auth-token'];
  if (token) {
    // Track active sessions with timestamp
    activeSessions.set(token, Date.now());
    req.sessionId = token;
  }
  next();
});

// Add CSRF error handler
app.use(csrfErrorHandler);

// Connect to MongoDB
connectDB().then((connection) => {
  if (connection) {
    console.log('✅ MongoDB connection established');
  } else {
    console.log('⚠️ MongoDB connection failed, but server will continue');
  }
}).catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  console.log('⚠️ Server will continue without MongoDB connection');
});

// Use Routes
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/study-sessions', studyRoutes);
app.use('/api/focus-sessions', focusRoutes);

// CSRF Token Generation
app.get('/api/csrf-token', generateToken);

// Simple health check endpoint (no MongoDB dependency)
app.get('/api/ping', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Server Health Check with MongoDB status and memory info
app.get('/api/health', async (req, res) => {
  try {
    // Get actual MongoDB connection status
    const mongoose = await import('mongoose');
    const mongoReadyState = mongoose.default.connection.readyState;
    const mongoStatus = mongoReadyState === 1 ? 'connected' : 'disconnected';
    
    // Get memory usage for monitoring
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    // Determine overall status
    const overallStatus = mongoReadyState === 1 ? 'ok' : 'degraded';
    
    res.status(overallStatus === 'ok' ? 200 : 503).json({ 
      status: overallStatus,
      message: overallStatus === 'ok' ? 'Server is running' : 'Server is running but MongoDB is disconnected',
      mongodb: {
        status: mongoStatus,
        readyState: mongoReadyState,
        host: mongoose.default.connection.host || 'unknown',
        port: mongoose.default.connection.port || 27017,
        name: mongoose.default.connection.name || 'student-sentience'
      },
      memory: memUsageMB,
      activeSessions: activeSessions ? activeSessions.size : 0,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Memory monitoring
const startMemoryMonitoring = () => {
  console.log('📊 Memory monitoring started');
  
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    console.log(`📊 Memory Usage: RSS: ${memUsageMB.rss}MB, Heap: ${memUsageMB.heapUsed}MB/${memUsageMB.heapTotal}MB, External: ${memUsageMB.external}MB`);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }, 60000); // Every minute
};

// Start memory monitoring
startMemoryMonitoring();

// Error handling middleware with CORS headers
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  
  // Ensure CORS headers are set even for errors
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation Error', details: err.message });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ message: 'Duplicate field value' });
  }
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  // Clean up intervals
  if (global.memoryInterval) {
    clearInterval(global.memoryInterval);
  }
  if (global.sessionInterval) {
    clearInterval(global.sessionInterval);
  }
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
}); 