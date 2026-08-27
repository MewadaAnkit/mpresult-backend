const Student = require('../models/Student');
const StudentEnrollment = require('../models/StudentEnrollment');

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
      const newEnrollment = await StudentEnrollment.findOneAndUpdate(
        { studentId, sessionName: toSession },
        {
          studentId,
          admissionNo: student.admissionNo,
          sessionName: toSession,
          className: nextClass,
          sectionName: nextSection,
          rollNo: student.currentRollNo,
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
