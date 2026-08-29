const express = require('express');
const router = express.Router();
const { getTimetable, saveDayTimetable } = require('../controllers/timetableController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/roles');

router.use(protect);

router.get('/', requirePermission(PERMISSIONS.VIEW_TIMETABLE), getTimetable);
router.post('/', requirePermission(PERMISSIONS.MANAGE_TIMETABLE), saveDayTimetable);

module.exports = router;
