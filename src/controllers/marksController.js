const Marks = require('../models/Marks');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Examination = require('../models/Examination');
const { resolveSubjectComponents, validateComponentMarks } = require('../services/markingSchemeService');
const { parseBufferToRows, processMarksBulkImport } = require('../services/bulkImportService');
const { logAction } = require('../services/auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');

/**
 * Get entered marks for a class, section, exam, subject
 */
exports.getMarks = async (req, res, next) => {
  try {
    const { examinationId, className, sectionName, subjectId, studentId } = req.query;
    const query = {};

    if (examinationId) query.examinationId = examinationId;
    if (className) query.className = className.toUpperCase();
    if (sectionName) query.sectionName = sectionName.toUpperCase();
    if (subjectId) query.subjectId = subjectId;
    if (studentId) query.studentId = studentId;

    const marksList = await Marks.find(query)
      .populate('studentId', 'studentName admissionNo currentRollNo')
      .populate('subjectId', 'subjectName subjectCode components')
      .sort({ className: 1, sectionName: 1 });

    res.status(200).json({ success: true, count: marksList.length, data: marksList });
  } catch (err) { next(err); }
};

/**
 * Save / Update marks for a single student in a single subject
 */
exports.saveStudentSubjectMarks = async (req, res, next) => {
  try {
    const { studentId, examinationId, subjectId, components, status } = req.body;

    const exam = await Examination.findById(examinationId).populate('schemeId');
    if (!exam) return res.status(404).json({ success: false, message: 'Examination not found' });
    if (exam.isMarksEntryLocked) {
      return res.status(400).json({ success: false, message: 'Marks entry is locked for this examination' });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    // BUG-020 FIX: Support ABS (Absent) and EXP (Expelled) status
    const specialStatus = ['ABS', 'EXP'].includes(String(status).toUpperCase()) ? status.toUpperCase() : null;

    let percentage = 0;
    let isPassed = false;
    let validatedComponents = components;

    if (!specialStatus) {
      // Normal marks entry path
      const resolvedComponents = resolveSubjectComponents(exam.schemeId, subject);
      const validation = validateComponentMarks(components, resolvedComponents);

      if (!validation.isValid) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
      }

      percentage = validation.totalMax > 0 ? Number(((validation.totalObtained / validation.totalMax) * 100).toFixed(2)) : 0;
      isPassed = percentage >= (subject.totalPassingMarks || 33);
    } else {
      // ABS/EXP: zero marks, not passed
      validatedComponents = (components || []).map(c => ({ ...c, obtained: 0 }));
    }

    const resolvedComponents2 = resolveSubjectComponents(exam.schemeId, subject);
    const validation2 = validateComponentMarks(validatedComponents || [], resolvedComponents2);

    const oldMarkDoc = await Marks.findOne({ studentId, examinationId, subjectId });

    const markDoc = await Marks.findOneAndUpdate(
      { studentId, examinationId, subjectId },
      {
        studentId,
        admissionNo: student.admissionNo,
        examinationId,
        sessionName: exam.sessionName,
        className: student.currentClass,
        sectionName: student.currentSection,
        subjectId,
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        components: validatedComponents || [],
        totalMaxMarks: validation2.totalMax,
        totalObtainedMarks: specialStatus ? 0 : validation2.totalObtained,
        percentage: specialStatus ? 0 : percentage,
        isPassed: specialStatus ? false : isPassed,
        status: specialStatus || 'PRESENT', // BUG-020: track ABS/EXP
        enteredBy: req.user._id
      },
      { upsert: true, new: true }
    );

    await logAction({
      req,
      action: AUDIT_ACTIONS.ENTER_MARKS,
      module: 'MARKS',
      studentAdmissionNo: student.admissionNo,
      studentName: student.studentName,
      description: specialStatus
        ? `Marked ${student.studentName} as ${specialStatus} in ${subject.subjectName}`
        : `Saved marks for ${student.studentName} in ${subject.subjectName}: ${validation2.totalObtained}/${validation2.totalMax}`,
      oldValues: oldMarkDoc ? { totalObtained: oldMarkDoc.totalObtainedMarks } : null,
      newValues: { totalObtained: specialStatus ? 0 : validation2.totalObtained, status: specialStatus || 'PRESENT' }
    });

    res.status(200).json({ success: true, message: 'Marks saved successfully', data: markDoc });
  } catch (err) { next(err); }
};

/**
 * Grid Marks Entry (batch save marks for multiple students in a class for a subject)
 */
exports.saveGridMarks = async (req, res, next) => {
  try {
    const { examinationId, subjectId, entries } = req.body; // entries: [{ studentId, components: [...] }]

    const exam = await Examination.findById(examinationId).populate('schemeId');
    if (!exam) return res.status(404).json({ success: false, message: 'Examination not found' });
    if (exam.isMarksEntryLocked) return res.status(400).json({ success: false, message: 'Marks entry is locked' });

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    const resolvedComponents = resolveSubjectComponents(exam.schemeId, subject);
    const successful = [];
    const errors = [];

    for (const entry of entries) {
      const { studentId, components, status: entryStatus } = entry;
      const student = await Student.findById(studentId);
      if (!student) {
        errors.push({ studentId, error: 'Student not found' });
        continue;
      }

      // BUG-020 FIX: Handle ABS/EXP in grid marks
      const specialStatus = ['ABS', 'EXP'].includes(String(entryStatus || '').toUpperCase())
        ? entryStatus.toUpperCase() : null;

      let percentage = 0;
      let isPassed = false;
      let finalComponents = components;

      if (!specialStatus) {
        const validation = validateComponentMarks(components, resolvedComponents);
        if (!validation.isValid) {
          errors.push({ studentId, admissionNo: student.admissionNo, errors: validation.errors });
          continue;
        }
        percentage = validation.totalMax > 0 ? Number(((validation.totalObtained / validation.totalMax) * 100).toFixed(2)) : 0;
        isPassed = percentage >= (subject.totalPassingMarks || 33);
      } else {
        finalComponents = (components || []).map(c => ({ ...c, obtainedMarks: 0 }));
      }

      const totalValidation = validateComponentMarks(finalComponents || [], resolvedComponents);

      await Marks.findOneAndUpdate(
        { studentId, examinationId, subjectId },
        {
          studentId,
          admissionNo: student.admissionNo,
          examinationId,
          sessionName: exam.sessionName,
          className: student.currentClass,
          sectionName: student.currentSection,
          subjectId,
          subjectName: subject.subjectName,
          subjectCode: subject.subjectCode,
          components: finalComponents || [],
          totalMaxMarks: totalValidation.totalMax,
          totalObtainedMarks: specialStatus ? 0 : totalValidation.totalObtained,
          percentage: specialStatus ? 0 : percentage,
          isPassed: specialStatus ? false : isPassed,
          status: specialStatus || 'PRESENT',
          enteredBy: req.user._id
        },
        { upsert: true, new: true }
      );

      successful.push({ studentId, admissionNo: student.admissionNo, totalObtained: specialStatus ? 0 : totalValidation.totalObtained });
    }

    await logAction({
      req,
      action: AUDIT_ACTIONS.ENTER_MARKS,
      module: 'MARKS',
      description: `Grid marks updated for ${successful.length} students in ${subject.subjectName}`
    });

    res.status(200).json({
      success: true,
      message: `Updated marks for ${successful.length} students`,
      successCount: successful.length,
      errorCount: errors.length,
      errors
    });
  } catch (err) { next(err); }
};

/**
 * Bulk Import Marks from Excel / CSV
 */
exports.bulkImportMarks = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel or CSV file' });
    }

    const { examinationId, subjectId } = req.body;
    if (!examinationId || !subjectId) {
      return res.status(400).json({ success: false, message: 'Examination ID and Subject ID are required' });
    }

    const rows = parseBufferToRows(req.file.buffer);
    const result = await processMarksBulkImport(rows, examinationId, subjectId, req.user);

    await logAction({
      req,
      action: AUDIT_ACTIONS.BULK_IMPORT_MARKS,
      module: 'MARKS',
      description: `Bulk imported marks for ${result.successCount} students`
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
};
