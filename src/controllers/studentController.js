const Student = require('../models/Student');
const StudentEnrollment = require('../models/StudentEnrollment');
const StudentFeeLedger = require('../models/StudentFeeLedger');
const FeePayment = require('../models/FeePayment');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const Certificate = require('../models/Certificate');
const { parseBufferToRows, processStudentBulkImport } = require('../services/bulkImportService');
const { promoteStudents } = require('../services/promotionService');
const { logAction } = require('../services/auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');

exports.getStudents = async (req, res, next) => {
  try {
    const { sessionName, className, sectionName, search, streamName } = req.query;
    const query = { isActive: true };

    if (className) query.currentClass = className.toUpperCase();
    if (sectionName) query.currentSection = sectionName.toUpperCase();
    if (sessionName) query.currentSession = sessionName;
    if (streamName) query.currentStream = streamName;

    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { admissionNo: { $regex: search, $options: 'i' } },
        { samagraId: { $regex: search, $options: 'i' } },
        { mpBseRollNo: { $regex: search, $options: 'i' } },
        { currentRollNo: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query).sort({ currentClass: 1, currentSection: 1, currentRollNo: 1 });
    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (err) {
    next(err);
  }
};

exports.getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Fetch full academic progression history
    const history = await StudentEnrollment.find({ studentId: student._id })
      .populate('subjectCombinationId')
      .sort({ sessionName: -1 });

    res.status(200).json({ success: true, data: { student, history } });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Student 360 Comprehensive Profile
// @route   GET /api/students/:id/360
exports.getStudent360 = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // BUG-011 FIX: Parents can only view their linked children's profiles
    if (req.user && req.user.role === 'PARENT') {
      const linkedIds = (req.user.linkedStudents || []).map(id => id.toString());
      if (linkedIds.length > 0 && !linkedIds.includes(student._id.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own child\'s profile. Contact the school administrator to link your account.'
        });
      }
      // If parent has no linked students configured yet, deny by default for safety
      if (linkedIds.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No student linked to your parent account. Please contact the school administrator.'
        });
      }
    }

    // Academic Enrollments
    const enrollments = await StudentEnrollment.find({ studentId: student._id }).sort({ sessionName: -1 });

    // Fee Ledger & Payments
    const feeLedger = await StudentFeeLedger.findOne({
      student: student._id,
      academicSession: student.currentSession
    });
    const feePayments = await FeePayment.find({ student: student._id }).sort({ paymentDate: -1 });

    // Attendance Summary
    const attendances = await Attendance.find({ 'records.student': student._id }).sort({ date: -1 });
    let presentCount = 0;
    let totalDays = 0;
    const attendanceRecords = [];
    attendances.forEach((att) => {
      const rec = att.records.find((r) => String(r.student) === String(student._id));
      if (rec) {
        totalDays++;
        if (rec.status === 'PRESENT') presentCount++;
        attendanceRecords.push({
          date: att.date,
          status: rec.status,
          remarks: rec.remarks
        });
      }
    });
    const attendanceRate = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) : null;

    // Exam Results — query by studentId (primary) or admissionNo (fallback)
    const results = await Result.find({
      $or: [
        { studentId: student._id },
        { admissionNo: student.admissionNo }
      ]
    }).sort({ createdAt: -1 });

    // Certificates
    const certificates = await Certificate.find({ student: student._id }).sort({ issueDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        student,
        enrollments,
        fee: {
          ledger: feeLedger,
          payments: feePayments
        },
        attendance: {
          totalDays,
          presentCount,
          attendanceRate,
          recentRecords: attendanceRecords.slice(0, 20)
        },
        results,
        certificates
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createStudent = async (req, res, next) => {
  try {
    const { studentName, admissionNo, fatherName, motherName, mobileNo, samagraId, currentClass, currentSection, currentRollNo, currentSession } = req.body;

    // Server-side validation
    if (!studentName || !studentName.trim()) {
      return res.status(400).json({ success: false, message: 'Student Full Name is required' });
    }
    const cleanStudentName = studentName.replace(/<[^>]*>?/gm, '').trim();
    if (cleanStudentName.length < 2) {
      return res.status(400).json({ success: false, message: 'Student name must be at least 2 characters' });
    }
    if (!/^[a-zA-Z\u0900-\u097F\s.'-]+$/.test(cleanStudentName)) {
      return res.status(400).json({ success: false, message: 'Student name contains invalid characters. Only letters, spaces, and dots are allowed.' });
    }

    if (!admissionNo || !admissionNo.trim()) {
      return res.status(400).json({ success: false, message: 'Admission Number is required' });
    }
    const cleanAdmissionNo = admissionNo.trim().toUpperCase();

    // Check duplicate admission number
    const existing = await Student.findOne({ admissionNo: cleanAdmissionNo });
    if (existing) {
      return res.status(409).json({ success: false, message: `A student with admission number ${cleanAdmissionNo} already exists` });
    }

    const cleanFatherName = fatherName ? fatherName.replace(/<[^>]*>?/gm, '').trim() : '';
    if (cleanFatherName && !/^[a-zA-Z\u0900-\u097F\s.'-]+$/.test(cleanFatherName)) {
      return res.status(400).json({ success: false, message: "Father's name contains invalid characters." });
    }

    const cleanMotherName = motherName ? motherName.replace(/<[^>]*>?/gm, '').trim() : '';
    if (cleanMotherName && !/^[a-zA-Z\u0900-\u097F\s.'-]+$/.test(cleanMotherName)) {
      return res.status(400).json({ success: false, message: "Mother's name contains invalid characters." });
    }

    if (mobileNo && mobileNo.trim()) {
      const cleanPhone = mobileNo.trim().replace(/[\s-+]/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number starting with 6, 7, 8, or 9' });
      }
    }

    if (samagraId && samagraId.trim()) {
      const cleanSamagra = samagraId.trim();
      if (!/^\d{9}$/.test(cleanSamagra)) {
        return res.status(400).json({ success: false, message: 'Samagra ID must be exactly 9 digits' });
      }
    }

    const studentData = {
      ...req.body,
      admissionNo: cleanAdmissionNo,
      studentName: cleanStudentName,
      fatherName: cleanFatherName,
      motherName: cleanMotherName,
      samagraId: samagraId ? samagraId.trim() : '',
      mobileNo: mobileNo ? mobileNo.trim().replace(/[\s-+]/g, '') : '',
      address: req.body.address ? req.body.address.replace(/<[^>]*>?/gm, '').trim() : '',
      currentStream: req.body.currentStream ? req.body.currentStream.replace(/<[^>]*>?/gm, '').trim() : '',
      createdBy: req.user ? req.user._id : null
    };
    const student = await Student.create(studentData);

    // Create initial enrollment
    await StudentEnrollment.create({
      studentId: student._id,
      admissionNo: student.admissionNo,
      sessionName: student.currentSession,
      className: student.currentClass,
      sectionName: student.currentSection,
      rollNo: student.currentRollNo,
      streamName: student.currentStream,
      status: 'ACTIVE'
    });

    await logAction({
      req,
      action: AUDIT_ACTIONS.CREATE_STUDENT,
      module: 'STUDENTS',
      studentAdmissionNo: student.admissionNo,
      studentName: student.studentName,
      description: `Added student ${student.studentName} (Admission: ${student.admissionNo}, Class: ${student.currentClass})`
    });

    res.status(201).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (req.body.studentName) {
      const clean = req.body.studentName.replace(/<[^>]*>?/gm, '').trim();
      if (clean.length < 2 || !/^[a-zA-Z\u0900-\u097F\s.'-]+$/.test(clean)) {
        return res.status(400).json({ success: false, message: 'Invalid student name' });
      }
      req.body.studentName = clean;
    }

    if (req.body.fatherName) {
      req.body.fatherName = req.body.fatherName.replace(/<[^>]*>?/gm, '').trim();
    }
    if (req.body.motherName) {
      req.body.motherName = req.body.motherName.replace(/<[^>]*>?/gm, '').trim();
    }
    if (req.body.mobileNo) {
      const cleanPhone = req.body.mobileNo.trim().replace(/[\s-+]/g, '');
      if (cleanPhone && !/^[6-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({ success: false, message: 'Invalid 10-digit mobile number' });
      }
      req.body.mobileNo = cleanPhone;
    }

    const oldValues = { ...student.toObject() };
    Object.assign(student, req.body);
    await student.save();

    // Update active enrollment if class/section/roll changed
    await StudentEnrollment.findOneAndUpdate(
      { studentId: student._id, sessionName: student.currentSession },
      {
        className: student.currentClass,
        sectionName: student.currentSection,
        rollNo: student.currentRollNo,
        streamName: student.currentStream
      }
    );

    await logAction({
      req,
      action: AUDIT_ACTIONS.UPDATE_STUDENT,
      module: 'STUDENTS',
      studentAdmissionNo: student.admissionNo,
      studentName: student.studentName,
      description: `Updated profile for student ${student.studentName}`,
      oldValues,
      newValues: req.body
    });

    res.status(200).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};

exports.bulkImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel (.xlsx/.xls) or CSV file' });
    }

    const { sessionName } = req.body;
    if (!sessionName) {
      return res.status(400).json({ success: false, message: 'Target Academic Session is required' });
    }

    const rows = parseBufferToRows(req.file.buffer);
    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Uploaded file contains no valid rows' });
    }

    const result = await processStudentBulkImport(rows, sessionName, req.user);

    await logAction({
      req,
      action: AUDIT_ACTIONS.BULK_IMPORT_STUDENTS,
      module: 'STUDENTS',
      description: `Bulk imported ${result.successCount} students into session ${sessionName}`
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.promote = async (req, res, next) => {
  try {
    const { studentIds, fromSession, toSession, toClass, toSection, toStream, status } = req.body;
    if (!studentIds || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No students selected for promotion' });
    }

    const result = await promoteStudents({
      studentIds,
      fromSession,
      toSession,
      toClass,
      toSection,
      toStream,
      status,
      user: req.user
    });

    await logAction({
      req,
      action: AUDIT_ACTIONS.PROMOTE_STUDENT,
      module: 'STUDENTS',
      description: `Promoted ${result.successCount} students from ${fromSession} to ${toClass} (${toSession})`
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
