const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const {
  getExternalResults, createExternalResult, bulkImportExternalResults
} = require('../controllers/externalResultController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../constants/roles');

router.route('/')
  .get(protect, getExternalResults)
  .post(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), createExternalResult);

router.post('/bulk-import', protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), upload.single('file'), bulkImportExternalResults);

module.exports = router;
