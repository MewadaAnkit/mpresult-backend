const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement
} = require('../controllers/communicationController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/roles');

router.use(protect);

router.get('/announcements', requirePermission(PERMISSIONS.VIEW_COMMUNICATION), getAnnouncements);
router.post('/announcements', requirePermission(PERMISSIONS.MANAGE_COMMUNICATION), createAnnouncement);
router.delete('/announcements/:id', requirePermission(PERMISSIONS.MANAGE_COMMUNICATION), deleteAnnouncement);

module.exports = router;
