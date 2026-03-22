import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

// Validate critical environment variables at startup
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

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
import syncRoutes from './routes/syncRoutes.js';



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
  /^https:\/\/deploy-preview-\d+--sentiencehub\.netlify\.app$/,
  /^https:\/\/[^\.]+\.netlify\.app$/
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser or same-origin
    if (allowedOrigins.includes(origin) || allowedOriginRegexes.some((re) => re.test(origin))) {
      return callback(null, true);
    }
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

// Body parsing middleware
app.use(express.json({ limit: '5mb' }));
// Intercept JSON syntax errors gracefully
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Invalid JSON payload received' 
    });
  }
  next(err);
});
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Add CSRF protection AFTER body parsers so req.body is available
app.use('/api/', csrfProtection);

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 seconds
  res.setTimeout(30000); // 30 seconds
  next();
});


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

// Import error handler
import errorHandler from './middleware/errorHandler.js';

// Use Routes
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/study-sessions', studyRoutes);
app.use('/api/focus-sessions', focusRoutes);
app.use('/api/sync', syncRoutes);

// CSRF Token Generation
app.get('/api/csrf-token', generateToken);

// Simple health check endpoint (no MongoDB dependency)
app.get('/api/ping', (_req, res) => {
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

// Apply global error handler
app.use(errorHandler);

// Connect to MongoDB — server won't start without a successful connection
connectDB().then((connection) => {
  if (!connection) {
    console.error('❌ Failed to connect to MongoDB. Exiting.');
    process.exit(1);
  }
  console.log('✅ MongoDB connection established');

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  });
}).catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
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