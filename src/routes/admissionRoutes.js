const express = require('express');
const router = express.Router();
const {
  getInquiries,
  createInquiry,
  updateInquiry,
  addNote,
  convertInquiryToStudent
} = require('../controllers/admissionController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/roles');

router.use(protect);

router.get('/inquiries', requirePermission(PERMISSIONS.VIEW_ADMISSIONS), getInquiries);
router.post('/inquiries', requirePermission(PERMISSIONS.MANAGE_ADMISSIONS), createInquiry);
router.put('/inquiries/:id', requirePermission(PERMISSIONS.MANAGE_ADMISSIONS), updateInquiry);
router.post('/inquiries/:id/notes', requirePermission(PERMISSIONS.MANAGE_ADMISSIONS), addNote);
router.post('/inquiries/:id/convert', requirePermission(PERMISSIONS.MANAGE_ADMISSIONS), convertInquiryToStudent);

module.exports = router;
