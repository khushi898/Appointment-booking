const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

// Limits each IP to a few auth requests per 15 minutes to slow down
// password-guessing (brute force) and mass account creation.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.authRateLimitMax,
  standardHeaders: 'draft-8', // sends RateLimit headers so clients know when to retry
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again in 15 minutes' },
});

module.exports = { authLimiter };
