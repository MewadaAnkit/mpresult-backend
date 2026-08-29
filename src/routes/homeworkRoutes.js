const express = require('express');
const router = express.Router();
const { getHomeworkList, createHomework, deleteHomework } = require('../controllers/homeworkController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/roles');

router.use(protect);

router.get('/', requirePermission(PERMISSIONS.VIEW_HOMEWORK), getHomeworkList);
router.post('/', requirePermission(PERMISSIONS.MANAGE_HOMEWORK), createHomework);
router.delete('/:id', requirePermission(PERMISSIONS.MANAGE_HOMEWORK), deleteHomework);

module.exports = router;
