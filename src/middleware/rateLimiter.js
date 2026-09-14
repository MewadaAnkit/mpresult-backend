const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter for Login Endpoint
 * Protects against credential stuffing and brute-force password attacks
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 15, // Max 15 attempts per IP address
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please wait 15 minutes before trying again.'
  }
});

module.exports = {
  loginRateLimiter
};
