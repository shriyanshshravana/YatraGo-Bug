const path = require('path');
const dotenv = require('dotenv');

// Ensure environment variables are loaded before accessing process.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');

let isConnected = false;

/**
 * Sanitize error messages so that connection strings or credentials are never exposed in logs
 * @param {string} message
 * @returns {string}
 */
const sanitizeErrorMessage = (message) => {
  if (!message) return 'Unknown database error';
  return message.replace(/mongodb(\+srv)?:\/\/[^@\s]+@/gi, 'mongodb$1://<credentials-hidden>@');
};

/**
 * Automatically normalize connection string by URL-encoding special characters in password
 * @param {string} rawUri
 * @returns {string}
 */
const normalizeMongoUri = (rawUri) => {
  if (!rawUri) return rawUri;
  const match = rawUri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.*)@([^@\/]+)(\/.*)?$/);
  if (match) {
    const [, proto, user, pwd, host, rest] = match;
    try {
      const decoded = decodeURIComponent(pwd);
      const encoded = encodeURIComponent(decoded);
      return `${proto}${user}:${encoded}@${host}${rest || ''}`;
    } catch {
      return rawUri;
    }
  }
  return rawUri;
};

/**
 * Connect to MongoDB Atlas using Mongoose
 * Reads MONGODB_URI with fallback to MONGO_URI.
 * @returns {Promise<boolean>}
 */
const connectDB = async () => {
  const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!rawUri || rawUri.trim() === '') {
    console.error('❌ [Database] Neither MONGODB_URI nor MONGO_URI is defined in Backend/.env.');
    return false;
  }

  // Check if placeholder password is still present
  if (rawUri.includes('YOUR_NEW_URL_ENCODED_PASSWORD') || rawUri.includes('<password>')) {
    console.error('❌ [Database] MONGODB_URI in Backend/.env contains an unreplaced password placeholder.');
    console.error('👉 Please update Backend/.env with your real MongoDB Atlas password.');
    return false;
  }

  const uri = normalizeMongoUri(rawUri.trim());

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`✅ [Database] MongoDB Atlas Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    const safeError = sanitizeErrorMessage(error.message);
    console.error(`❌ [Database] Connection Error: ${safeError}`);
    console.warn('👉 Please verify your MongoDB Atlas password (URL-encoded if containing special characters), user permissions, and Network Access IP whitelist (0.0.0.0/0).');
    return false;
  }
};

/**
 * Check if MongoDB is currently connected
 * @returns {boolean}
 */
const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Monitor connection events
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[Database] MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('[Database] MongoDB reconnected.');
});

module.exports = {
  connectDB,
  isDbConnected,
};
