const express = require('express');
const router = express.Router();
const {
  getSchemes, getSchemeById, createScheme, updateScheme,
  getGradeRules, createGradeRule, updateGradeRule,
  getPassingRules, createPassingRule, updatePassingRule
} = require('../controllers/schemeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../constants/roles');

router.route('/')
  .get(protect, getSchemes)
  .post(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), createScheme);

router.route('/grade-rules')
  .get(protect, getGradeRules)
  .post(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), createGradeRule);

router.route('/grade-rules/:id')
  .put(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), updateGradeRule);

router.route('/passing-rules')
  .get(protect, getPassingRules)
  .post(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), createPassingRule);

router.route('/passing-rules/:id')
  .put(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), updatePassingRule);

router.route('/:id')
  .get(protect, getSchemeById)
  .put(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), updateScheme);

module.exports = router;
