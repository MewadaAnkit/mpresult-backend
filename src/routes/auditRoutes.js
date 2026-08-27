const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../constants/roles');

router.get('/', protect, authorize(ROLES.ADMIN, ROLES.PRINCIPAL), getAuditLogs);

module.exports = router;
