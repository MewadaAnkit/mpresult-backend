const express = require('express');
const router = express.Router();
const {
  getExaminations, getExaminationById, createExamination, updateExamination, deleteExamination, toggleMarksLock
} = require('../controllers/examController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../constants/roles');

router.route('/')
  .get(protect, getExaminations)
  .post(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), createExamination);

router.route('/:id')
  .get(protect, getExaminationById)
  .put(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), updateExamination)
  .delete(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), deleteExamination);

router.put('/:id/toggle-lock', protect, authorize(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.EXAM_INCHARGE), toggleMarksLock);

module.exports = router;
