const express = require('express');
const router = express.Router();
const {
  getFeeHeads,
  createFeeHead,
  getFeeStructures,
  saveFeeStructure,
  searchStudentForFee,
  collectFeePayment,
  getReceipts,
  getReceiptById,
  getFinancialSummary
} = require('../controllers/feeController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/roles');

router.use(protect);

router.get('/heads', requirePermission(PERMISSIONS.VIEW_FEES), getFeeHeads);
router.post('/heads', requirePermission(PERMISSIONS.MANAGE_FEE_STRUCTURES), createFeeHead);

router.get('/structures', requirePermission(PERMISSIONS.VIEW_FEES), getFeeStructures);
router.post('/structures', requirePermission(PERMISSIONS.MANAGE_FEE_STRUCTURES), saveFeeStructure);

router.get('/search-student', requirePermission(PERMISSIONS.COLLECT_FEES), searchStudentForFee);
router.post('/collect', requirePermission(PERMISSIONS.COLLECT_FEES), collectFeePayment);

router.get('/receipts', requirePermission(PERMISSIONS.VIEW_FEES), getReceipts);
router.get('/receipts/:id', requirePermission(PERMISSIONS.VIEW_FEES), getReceiptById);

router.get('/summary', requirePermission(PERMISSIONS.VIEW_FINANCIAL_REPORTS), getFinancialSummary);

module.exports = router;
