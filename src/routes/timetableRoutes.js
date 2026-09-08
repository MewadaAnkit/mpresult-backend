const express = require('express');
const router = express.Router();
const { getTimetable, saveDayTimetable, autoGenerateClassTimetable, autoGenerateSchoolTimetable } = require('../controllers/timetableController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/roles');

router.use(protect);

router.get('/', requirePermission(PERMISSIONS.VIEW_TIMETABLE), getTimetable);
router.post('/', requirePermission(PERMISSIONS.MANAGE_TIMETABLE), saveDayTimetable);
router.post('/auto-generate', requirePermission(PERMISSIONS.MANAGE_TIMETABLE), autoGenerateClassTimetable);
router.post('/auto-generate-all', requirePermission(PERMISSIONS.MANAGE_TIMETABLE), autoGenerateSchoolTimetable);

module.exports = router;
