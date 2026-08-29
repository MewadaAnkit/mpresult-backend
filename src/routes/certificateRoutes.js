const express = require('express');
const router = express.Router();
const {
  getCertificates,
  issueCertificate,
  getCertificateById
} = require('../controllers/certificateController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/roles');

router.use(protect);

router.get('/', requirePermission(PERMISSIONS.VIEW_CERTIFICATES), getCertificates);
router.post('/', requirePermission(PERMISSIONS.MANAGE_CERTIFICATES), issueCertificate);
router.get('/:id', requirePermission(PERMISSIONS.VIEW_CERTIFICATES), getCertificateById);

module.exports = router;
