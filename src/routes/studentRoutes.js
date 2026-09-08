const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const {
  getStudents,
  getStudentById,
  getStudent360,
  createStudent,
  updateStudent,
  bulkImport,
  promote
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES, PERMISSIONS } = require('../constants/roles');

router
  .route('/')
  .get(protect, getStudents)
  .post(protect, authorize(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.STAFF, ROLES.ACCOUNTANT, PERMISSIONS.MANAGE_STUDENTS), createStudent);

router.get('/:id/360', protect, getStudent360);

router.post('/bulk-import', protect, authorize(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.STAFF, PERMISSIONS.MANAGE_STUDENTS), upload.single('file'), bulkImport);
router.post('/promote', protect, authorize(ROLES.ADMIN, ROLES.PRINCIPAL, PERMISSIONS.PROMOTE_STUDENTS), promote);

router
  .route('/:id')
  .get(protect, getStudentById)
  .put(protect, authorize(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.STAFF, PERMISSIONS.MANAGE_STUDENTS), updateStudent);

module.exports = router;
