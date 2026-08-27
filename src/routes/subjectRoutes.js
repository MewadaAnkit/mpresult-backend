const express = require('express');
const router = express.Router();
const {
  getSubjects, createSubject, updateSubject,
  getCombinations, createCombination
} = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../constants/roles');

router.route('/')
  .get(protect, getSubjects)
  .post(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), createSubject);

router.put('/:id', protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), updateSubject);

router.route('/combinations')
  .get(protect, getCombinations)
  .post(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), createCombination);

module.exports = router;
