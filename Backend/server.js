const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { connectDB, isDbConnected } = require('./config/db');
const { isEmailConfigured } = require('./utils/mailer');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const destinationRoutes = require('./routes/destinationRoutes');
const tripRoutes = require('./routes/tripRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const validateEnvironment = () => {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL'];
  const missing = required.filter((key) => {
    const value = process.env[key];
    return !value || value.includes('your_') || value.includes('<') || value.includes('>');
  });

  if (missing.length) {
    console.error('❌ Missing or placeholder environment values for:', missing.join(', '));
    console.error('👉 Configure the required settings in Backend/.env before starting the server.');
    return false;
  }

  return true;
};

// ==========================================
// Security Middlewares
// ==========================================
// Basic security headers with Helmet
app.use(helmet());

// Rate Limiter to guard against brute-force & denial of service
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
});
app.use(generalLimiter);

// Specific stricter rate limiter for sensitive auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again later.',
  },
});

// Cross-Origin Resource Sharing (CORS)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://yatra-go-tau.vercel.app',
];

if (process.env.FRONTEND_URL) {
  const customOrigin = process.env.FRONTEND_URL.replace(/\/+$/, '');
  if (!allowedOrigins.includes(customOrigin)) {
    allowedOrigins.push(customOrigin);
  }
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);

      // Normalize incoming origin by trimming any trailing slash
      const normalizedOrigin = origin.replace(/\/+$/, '');

      // Allow configured origins and all Vercel deployment URLs for YatraGo
      if (
        allowedOrigins.includes(normalizedOrigin) ||
        /^https:\/\/yatra-go.*\.vercel\.app$/.test(normalizedOrigin) ||
        normalizedOrigin.endsWith('.vercel.app') && normalizedOrigin.includes('yatra-go')
      ) {
        return callback(null, true);
      }

      // Permissive in non-production local development
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy: Origin ${origin} is not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsers with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Safe Request Logger (never logs request bodies, passwords, or tokens)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.path}`);
    next();
  });
}

// ==========================================
// Health Check Endpoints (both /api/health and /health)
// ==========================================
const healthCheckHandler = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'YatraGo API',
    tagline: 'Discover the wonder of India',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(1)}s`,
    environment: process.env.NODE_ENV || 'development',
    database: isDbConnected() ? 'connected' : 'disconnected',
    emailConfigured: isEmailConfigured(),
  });
};
app.get('/api/health', healthCheckHandler);
app.get('/health', healthCheckHandler);

// ==========================================
// API Routes (mounted under both /api/* and root /* for seamless compatibility)
// ==========================================
app.use('/api/auth', authLimiter, authRoutes);
app.use('/auth', authLimiter, authRoutes);

app.use('/api/users', userRoutes);
app.use('/users', userRoutes);

app.use('/api/destinations', destinationRoutes);
app.use('/destinations', destinationRoutes);

app.use('/api/trips', tripRoutes);
app.use('/trips', tripRoutes);

app.use('/api/reviews', reviewRoutes);
app.use('/reviews', reviewRoutes);
app.use('/api/destinations', reviewRoutes);
app.use('/destinations', reviewRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/notifications', notificationRoutes);

// Root Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'YatraGo Backend API',
    description: 'API for YatraGo - An India-Only Trip Planner',
    version: '1.0.0',
    documentation: 'See README.md for endpoint details',
    healthCheck: '/api/health',
  });
});

// ==========================================
// 404 & Centralised Error Handling
// ==========================================
app.use(notFound);
app.use(errorHandler);

// ==========================================
// Server Initialization
// ==========================================
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

let server = null;

/**
 * Start the server only after successfully connecting to MongoDB Atlas
 */
const startServer = async () => {
  try {
    if (!validateEnvironment()) {
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB Atlas...');
    const connected = await connectDB();

    if (!connected) {
      console.error('❌ Server startup aborted: Failed to establish database connection.');
      console.error('👉 Fix your database configuration in Backend/.env and try again.');
      process.exit(1);
    }

    server = app.listen(PORT, HOST, () => {
      console.log('====================================================');
      console.log(`🚀 YatraGo Backend Server is running!`);
      console.log(`📡 URL          : http://${HOST}:${PORT}`);
      console.log(`🩺 Health Check : http://localhost:${PORT}/api/health`);
      console.log(`🌐 Allowed CORS : ${allowedOrigins.join(', ')}`);
      console.log(`⚙️  Environment  : ${process.env.NODE_ENV || 'development'}`);
      console.log('====================================================');
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use by another running terminal or process.`);
        console.error(`👉 Run 'npx -y kill-port ${PORT}' or close the other running terminal.`);
      } else {
        console.error(`❌ Server Error: ${err.message}`);
      }
      process.exit(1);
    });

    return server;
  } catch (err) {
    console.error(`❌ Startup Error: ${err.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

// Handle unhandled promise rejections safely
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection] ${err.name}: ${err.message}`);
});

module.exports = { app, server, startServer };
