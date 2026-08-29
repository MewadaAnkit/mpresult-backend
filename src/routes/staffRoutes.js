const express = require('express');
const router = express.Router();
const {
  getStaffList,
  createStaff,
  updateStaff,
  deleteStaff,
  getAllocations,
  saveAllocation,
  deleteAllocation
} = require('../controllers/staffController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/roles');

router.use(protect);

router.get('/', requirePermission(PERMISSIONS.VIEW_STAFF), getStaffList);
router.post('/', requirePermission(PERMISSIONS.MANAGE_STAFF), createStaff);
router.put('/:id', requirePermission(PERMISSIONS.MANAGE_STAFF), updateStaff);
router.delete('/:id', requirePermission(PERMISSIONS.MANAGE_STAFF), deleteStaff);

router.get('/allocations', requirePermission(PERMISSIONS.VIEW_STAFF), getAllocations);
router.post('/allocations', requirePermission(PERMISSIONS.MANAGE_ALLOCATIONS), saveAllocation);
router.delete('/allocations/:id', requirePermission(PERMISSIONS.MANAGE_ALLOCATIONS), deleteAllocation);

module.exports = router;
