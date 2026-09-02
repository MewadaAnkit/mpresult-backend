const express = require('express');
const router = express.Router();
const {
  calculateSingleResult,
  calculateClassResults,
  getResults,
  getResultById,
  updateApprovalStage,
  reopenResult,
  downloadMarksheetPdf,
  downloadBulkMarksheetsZip
} = require('../controllers/resultController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../constants/roles');

router.route('/')
  .get(protect, getResults);

router.post('/calculate-single', protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE, ROLES.TEACHER), calculateSingleResult);
router.post('/calculate-class', protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE, ROLES.TEACHER), calculateClassResults);

router.put('/approval-stage', protect, authorize(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.EXAM_INCHARGE, ROLES.TEACHER), updateApprovalStage);
router.put('/:id/reopen', protect, authorize(ROLES.ADMIN, ROLES.PRINCIPAL), reopenResult);

// BUG-009 FIX: Bulk download restricted to Admin/Principal/Exam Incharge
router.get('/bulk-download', protect, authorize(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.EXAM_INCHARGE), downloadBulkMarksheetsZip);
router.get('/:id/pdf', protect, downloadMarksheetPdf);

router.route('/:id')
  .get(protect, getResultById);

module.exports = router;
