const express = require('express');
const router = express.Router();
const { getAnalytics, getTeacherDashboard } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAnalytics);
router.get('/summary', protect, getAnalytics);
router.get('/exam/:examinationId', protect, getAnalytics);
router.get('/teacher-dashboard', protect, getTeacherDashboard);

module.exports = router;
