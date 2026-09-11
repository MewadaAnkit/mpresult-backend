const express = require('express');
const router = express.Router();
const {
  getDailyAttendance,
  submitDailyAttendance,
  getAttendanceAnalytics,
  getStudentAttendance,
  getMyClassAllocation
} = require('../controllers/attendanceController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/roles');

router.use(protect);

router.get('/my-class', getMyClassAllocation);
router.get('/', requirePermission(PERMISSIONS.VIEW_ATTENDANCE), getDailyAttendance);
router.post('/', requirePermission(PERMISSIONS.MARK_ATTENDANCE), submitDailyAttendance);
router.get('/daily', requirePermission(PERMISSIONS.VIEW_ATTENDANCE), getDailyAttendance);
router.post('/daily', requirePermission(PERMISSIONS.MARK_ATTENDANCE), submitDailyAttendance);
router.get('/analytics', requirePermission(PERMISSIONS.VIEW_ATTENDANCE), getAttendanceAnalytics);
router.get('/student/:studentId', requirePermission(PERMISSIONS.VIEW_ATTENDANCE), getStudentAttendance);

module.exports = router;
