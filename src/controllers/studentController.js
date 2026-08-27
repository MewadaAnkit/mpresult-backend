const Student = require('../models/Student');
const StudentEnrollment = require('../models/StudentEnrollment');
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
  } catch (err) { next(err); }
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
  } catch (err) { next(err); }
};

exports.createStudent = async (req, res, next) => {
  try {
    const studentData = { ...req.body, createdBy: req.user._id };
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
  } catch (err) { next(err); }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

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
  } catch (err) { next(err); }
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
  } catch (err) { next(err); }
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
  } catch (err) { next(err); }
};
