const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { searchResult, verifyResult } = require('../controllers/publicController');

// Rate limiting for public result queries to protect privacy
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 requests per window
  message: { success: false, message: 'Too many search requests from this IP, please try again after 15 minutes' }
});

router.get('/search', searchLimiter, searchResult);
router.get('/verify/:code', verifyResult);

module.exports = router;
