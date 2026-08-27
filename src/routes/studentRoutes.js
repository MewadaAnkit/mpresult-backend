const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const {
  getStudents, getStudentById, createStudent, updateStudent, bulkImport, promote
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../constants/roles');

router.route('/')
  .get(protect, getStudents)
  .post(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE, ROLES.STAFF), createStudent);

router.post('/bulk-import', protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE), upload.single('file'), bulkImport);
router.post('/promote', protect, authorize(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.EXAM_INCHARGE), promote);

router.route('/:id')
  .get(protect, getStudentById)
  .put(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE, ROLES.STAFF), updateStudent);

module.exports = router;
