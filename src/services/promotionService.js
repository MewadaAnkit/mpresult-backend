const Student = require('../models/Student');
const StudentEnrollment = require('../models/StudentEnrollment');
const AcademicSession = require('../models/AcademicSession');

/**
 * Promote students from one class/session to the next session
 * Preserves full historical enrollment record permanently!
 */
const promoteStudents = async ({
  studentIds,
  fromSession,
  toSession,
  toClass,
  toSection,
  toStream = '',
  status = 'PROMOTED',
  user
}) => {
  // BUG-008 FIX: Validate that target session exists before proceeding
  const sessionExists = await AcademicSession.findOne({ sessionName: toSession });
  if (!sessionExists) {
    throw new Error(`Target academic session '${toSession}' does not exist. Please create it first in Academic Sessions.`);
  }

  const successful = [];
  const errors = [];

  for (const studentId of studentIds) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        errors.push({ studentId, error: 'Student not found' });
        continue;
      }

      // 1. Mark previous enrollment as PROMOTED/COMPLETED
      await StudentEnrollment.findOneAndUpdate(
        { studentId, sessionName: fromSession },
        { status: status === 'PROMOTED' ? 'PROMOTED' : 'DETAINED' }
      );

      // 2. Determine target class & section
      const nextClass = status === 'PROMOTED' ? toClass : student.currentClass;
      const nextSection = toSection || student.currentSection;
      const nextStream = toStream || student.currentStream;

      // 3. Create new session enrollment record
      // BUG-019 FIX: Reset rollNo to null — roll numbers must be re-assigned in new class
      const newEnrollment = await StudentEnrollment.findOneAndUpdate(
        { studentId, sessionName: toSession },
        {
          studentId,
          admissionNo: student.admissionNo,
          sessionName: toSession,
          className: nextClass,
          sectionName: nextSection,
          rollNo: '', // Reset roll number — to be assigned fresh in new class
          streamName: nextStream,
          status: 'ACTIVE',
          remarks: `Promoted from ${student.currentClass} (${fromSession}) to ${nextClass} (${toSession})`
        },
        { upsert: true, new: true }
      );

      // 4. Update student's current pointer
      student.currentSession = toSession;
      student.currentClass = nextClass;
      student.currentSection = nextSection;
      student.currentRollNo = ''; // BUG-019 FIX: Reset roll number on promotion
      if (nextStream) student.currentStream = nextStream;
      await student.save();

      successful.push({
        studentId: student._id,
        admissionNo: student.admissionNo,
        studentName: student.studentName,
        newClass: nextClass,
        newSection: nextSection,
        session: toSession
      });
    } catch (err) {
      errors.push({ studentId, error: err.message });
    }
  }

  return {
    totalAttempted: studentIds.length,
    successCount: successful.length,
    errorCount: errors.length,
    successful,
    errors
  };
};

module.exports = {
  promoteStudents
};
