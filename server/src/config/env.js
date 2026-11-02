// Loads variables from server/.env into process.env and exposes them as one config object.
require('dotenv').config({ quiet: true });

const REQUIRED_VARS = ['MONGODB_URI', 'JWT_SECRET'];

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  // IANA timezone of the business, e.g. "Asia/Kolkata" or "Europe/London".
  // Used to decide what "today" and "past appointment" mean.
  businessTimezone: process.env.BUSINESS_TIMEZONE || 'UTC',
  // Max requests per IP to /api/auth in a 15-minute window
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  // "http://a.com, http://b.com" -> ['http://a.com', 'http://b.com']
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

// Called once at startup so the server fails fast instead of crashing later.
function assertRequiredEnv() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = { env, assertRequiredEnv };
