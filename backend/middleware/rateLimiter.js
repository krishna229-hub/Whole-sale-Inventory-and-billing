const rateLimit = require('express-rate-limit');

// Apply a general rate limit: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: {
      code: 429,
      message: 'Too many requests, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = apiLimiter;
