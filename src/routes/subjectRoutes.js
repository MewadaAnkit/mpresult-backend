const express = require('express');
const router = express.Router();
const {
  getSubjects, createSubject, updateSubject, deleteSubject,
  getCombinations, createCombination, updateCombination, deleteCombination
} = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../constants/roles');

router.route('/')
  .get(protect, getSubjects)
  .post(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), createSubject);

router.route('/:id')
  .put(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), updateSubject)
  .delete(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), deleteSubject);

router.route('/combinations')
  .get(protect, getCombinations)
  .post(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), createCombination);

router.route('/combinations/:id')
  .put(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), updateCombination)
  .delete(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), deleteCombination);

module.exports = router;
