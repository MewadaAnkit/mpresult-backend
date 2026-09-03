const express = require('express');
const router = express.Router();
const {
  getExamSchedules,
  getScheduleDashboardStats,
  checkScheduleConflicts,
  bulkCreateExamSchedule,
  updateExamScheduleEntry,
  publishExamSchedule,
  deleteExamScheduleEntry,
  getPrintableClassTimetable,
  autoGenerateExamSchedule
} = require('../controllers/examScheduleController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../constants/roles');

router.use(protect);

router.get('/dashboard-stats', getScheduleDashboardStats);
router.post('/check-conflicts', checkScheduleConflicts);
router.get('/printable', getPrintableClassTimetable);
router.post('/auto-generate', authorize(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.EXAM_INCHARGE), autoGenerateExamSchedule);

router.route('/')
  .get(getExamSchedules)
  .post(authorize(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.EXAM_INCHARGE), bulkCreateExamSchedule);

router.post('/bulk', authorize(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.EXAM_INCHARGE), bulkCreateExamSchedule);
router.post('/publish', authorize(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.EXAM_INCHARGE), publishExamSchedule);

// BUG-016 FIX: Only Admin/Principal/Exam Incharge can modify/delete exam schedules
router.route('/:id')
  .put(authorize(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.EXAM_INCHARGE), updateExamScheduleEntry)
  .delete(authorize(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.EXAM_INCHARGE), deleteExamScheduleEntry);

module.exports = router;
