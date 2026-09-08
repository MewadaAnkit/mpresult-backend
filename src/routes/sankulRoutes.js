const express = require('express');
const router = express.Router();
const { getSankulData, exportSankulCsv } = require('../controllers/sankulController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../constants/roles');

// Accessible to all school staff and teachers
router.use(protect);
router.use(authorize(ROLES.ADMIN, ROLES.PRINCIPAL, ROLES.EXAM_INCHARGE, ROLES.TEACHER, ROLES.STAFF));

router.get('/returns', getSankulData);
router.get('/export-csv', exportSankulCsv);

module.exports = router;
