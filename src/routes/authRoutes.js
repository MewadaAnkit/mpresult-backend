const express = require('express');
const router = express.Router();
const { login, logout, getMe, createUser, getAllUsers, updateUser, deleteUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../constants/roles');

router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

router.route('/users')
  .get(protect, authorize(ROLES.ADMIN, ROLES.PRINCIPAL), getAllUsers)
  .post(protect, authorize(ROLES.ADMIN), createUser);

router.route('/users/:id')
  .put(protect, authorize(ROLES.ADMIN), updateUser)
  .delete(protect, authorize(ROLES.ADMIN), deleteUser);

module.exports = router;
