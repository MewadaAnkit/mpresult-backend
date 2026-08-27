const xlsx = require('xlsx');
const Student = require('../models/Student');
const StudentEnrollment = require('../models/StudentEnrollment');
const Marks = require('../models/Marks');
const Subject = require('../models/Subject');
const Examination = require('../models/Examination');
const { ATTENDANCE_STATUSES } = require('../constants/examinationTypes');

/**
 * Parse Excel or CSV buffer into an array of objects
 */
const parseBufferToRows = (buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return xlsx.utils.sheet_to_json(worksheet, { defval: '' });
};

/**
 * Bulk Import Students with validation
 */
const processStudentBulkImport = async (rows, sessionName, user) => {
  const successful = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const admissionNo = String(row.AdmissionNo || row.admissionNo || row['Admission Number'] || '').trim().toUpperCase();
    const studentName = String(row.StudentName || row.studentName || row.Name || '').trim();
    const className = String(row.Class || row.class || row.ClassName || '').trim().toUpperCase();
    const sectionName = String(row.Section || row.section || 'A').trim().toUpperCase();
    const rollNo = String(row.RollNo || row.rollNo || row.Roll || i + 1).trim();

    if (!admissionNo) {
      errors.push({ row: rowNum, error: 'Admission Number is required' });
      continue;
    }
    if (!studentName) {
      errors.push({ row: rowNum, error: 'Student Name is required' });
      continue;
    }
    if (!className) {
      errors.push({ row: rowNum, error: 'Class is required' });
      continue;
    }

    try {
      let student = await Student.findOne({ admissionNo });

      const studentData = {
        admissionNo,
        studentName,
        fatherName: String(row.FatherName || row.fatherName || '').trim(),
        motherName: String(row.MotherName || row.motherName || '').trim(),
        samagraId: String(row.SamagraId || row.samagraId || '').trim(),
        mpBseRollNo: String(row.MpBseRollNo || row.mpBseRollNo || '').trim(),
        gender: ['FEMALE', 'F'].includes(String(row.Gender || '').toUpperCase()) ? 'FEMALE' : 'MALE',
        dob: row.DOB || row.dob ? new Date(row.DOB || row.dob) : null,
        mobileNo: String(row.Mobile || row.mobileNo || '').trim(),
        address: String(row.Address || row.address || '').trim(),
        currentSession: sessionName,
        currentClass: className,
        currentSection: sectionName,
        currentRollNo: rollNo,
        currentStream: String(row.Stream || row.stream || '').trim(),
        createdBy: user ? user._id : null
      };

      if (student) {
        Object.assign(student, studentData);
        await student.save();
      } else {
        student = await Student.create(studentData);
      }

      // Create / Update Enrollment
      await StudentEnrollment.findOneAndUpdate(
        { studentId: student._id, sessionName },
        {
          studentId: student._id,
          admissionNo: student.admissionNo,
          sessionName,
          className,
          sectionName,
          rollNo,
          streamName: student.currentStream,
          status: 'ACTIVE'
        },
        { upsert: true, new: true }
      );

      successful.push({ row: rowNum, admissionNo, studentName, className, sectionName });
    } catch (err) {
      errors.push({ row: rowNum, admissionNo, error: err.message });
    }
  }

  return {
    totalRows: rows.length,
    successCount: successful.length,
    errorCount: errors.length,
    successful,
    errors
  };
};

/**
 * Bulk Import Marks for an Examination and Subject
 */
const processMarksBulkImport = async (rows, examinationId, subjectId, user) => {
  const exam = await Examination.findById(examinationId).populate('schemeId');
  if (!exam) throw new Error('Examination not found');
  if (exam.isMarksEntryLocked) throw new Error('Marks entry is locked for this examination');

  const subject = await Subject.findById(subjectId);
  if (!subject) throw new Error('Subject not found');

  const scheme = exam.schemeId;
  const { resolveSubjectComponents } = require('./markingSchemeService');
  const resolvedComponents = resolveSubjectComponents(scheme, subject);

  const successful = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const admissionNo = String(row.AdmissionNo || row.admissionNo || row['Admission Number'] || '').trim().toUpperCase();

    if (!admissionNo) {
      errors.push({ row: rowNum, error: 'Admission Number is missing' });
      continue;
    }

    const student = await Student.findOne({ admissionNo });
    if (!student) {
      errors.push({ row: rowNum, admissionNo, error: `Student with admission no ${admissionNo} not found` });
      continue;
    }

    // Build component scores from row
    const components = [];
    let totalObtained = 0;
    let totalMax = 0;
    let hasError = false;

    for (const comp of resolvedComponents) {
      totalMax += comp.maxMarks;
      // Match column by comp.code, comp.name, or type
      const rawVal = row[comp.code] !== undefined ? row[comp.code] : (row[comp.name] !== undefined ? row[comp.name] : row.Marks);
      
      let val = 0;
      let status = ATTENDANCE_STATUSES.PRESENT;

      if (String(rawVal).toUpperCase() === 'AB' || String(rawVal).toUpperCase() === 'ABSENT') {
        status = ATTENDANCE_STATUSES.ABSENT;
        val = 0;
      } else {
        val = Number(rawVal) || 0;
        if (val < 0 || val > comp.maxMarks) {
          errors.push({ row: rowNum, admissionNo, error: `${comp.name} marks (${val}) out of bounds [0 - ${comp.maxMarks}]` });
          hasError = true;
          break;
        }
      }

      totalObtained += val;
      components.push({
        componentCode: comp.code,
        componentName: comp.name,
        maxMarks: comp.maxMarks,
        obtainedMarks: val,
        attendanceStatus: status
      });
    }

    if (hasError) continue;

    const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
    const isPassed = percentage >= (subject.totalPassingMarks || 33);

    try {
      await Marks.findOneAndUpdate(
        { studentId: student._id, examinationId, subjectId },
        {
          studentId: student._id,
          admissionNo: student.admissionNo,
          examinationId,
          sessionName: exam.sessionName,
          className: student.currentClass,
          sectionName: student.currentSection,
          subjectId,
          subjectName: subject.subjectName,
          subjectCode: subject.subjectCode,
          components,
          totalMaxMarks: totalMax,
          totalObtainedMarks: totalObtained,
          percentage,
          isPassed,
          enteredBy: user ? user._id : null
        },
        { upsert: true, new: true }
      );

      successful.push({ row: rowNum, admissionNo, studentName: student.studentName, totalObtained, totalMax });
    } catch (err) {
      errors.push({ row: rowNum, admissionNo, error: err.message });
    }
  }

  return {
    totalRows: rows.length,
    successCount: successful.length,
    errorCount: errors.length,
    successful,
    errors
  };
};

module.exports = {
  parseBufferToRows,
  processStudentBulkImport,
  processMarksBulkImport
};
