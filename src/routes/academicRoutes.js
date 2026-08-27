const express = require('express');
const router = express.Router();
const {
  getSessions, createSession, setCurrentSession,
  getClasses, createClass,
  getSections, createSection,
  getStreams, createStream
} = require('../controllers/academicController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../constants/roles');

// Sessions
router.route('/sessions')
  .get(protect, getSessions)
  .post(protect, authorize(ROLES.ADMIN, ROLES.PRINCIPAL), createSession);

router.put('/sessions/:id/set-current', protect, authorize(ROLES.ADMIN, ROLES.PRINCIPAL), setCurrentSession);

// Classes
router.route('/classes')
  .get(protect, getClasses)
  .post(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), createClass);

// Sections
router.route('/sections')
  .get(protect, getSections)
  .post(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), createSection);

// Streams
router.route('/streams')
  .get(protect, getStreams)
  .post(protect, authorize(ROLES.ADMIN), createStream);

module.exports = router;
