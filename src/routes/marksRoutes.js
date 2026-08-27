const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const {
  getMarks, saveStudentSubjectMarks, saveGridMarks, bulkImportMarks
} = require('../controllers/marksController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../constants/roles');

router.route('/')
  .get(protect, getMarks)
  .post(protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE, ROLES.TEACHER), saveStudentSubjectMarks);

router.post('/grid', protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE, ROLES.TEACHER), saveGridMarks);
router.post('/bulk-import', protect, authorize(ROLES.ADMIN, ROLES.EXAM_INCHARGE, ROLES.TEACHER), upload.single('file'), bulkImportMarks);

module.exports = router;
