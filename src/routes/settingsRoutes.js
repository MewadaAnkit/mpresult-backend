const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../constants/roles');

router.route('/')
  .get(getSettings) // Can be public for branding
  .put(protect, authorize(ROLES.ADMIN, ROLES.PRINCIPAL), updateSettings);

module.exports = router;
