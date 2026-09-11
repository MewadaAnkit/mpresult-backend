const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const TeacherAllocation = require('../models/TeacherAllocation');
const Staff = require('../models/Staff');

// @desc    Get attendance for a specific class on a date
// @route   GET /api/attendance/daily
exports.getDailyAttendance = async (req, res, next) => {
  try {
    const { session, className, sectionName, date, subjectCode } = req.query;
    if (!session || !className || !sectionName || !date) {
      return res.status(400).json({ success: false, message: 'Session, Class, Section and Date are required' });
    }

    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(searchDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const targetSubjectCode = (subjectCode || 'DAILY').toUpperCase();

    const existing = await Attendance.findOne({
      academicSession: session,
      className: className.toUpperCase(),
      sectionName: sectionName.toUpperCase(),
      subjectCode: targetSubjectCode,
      date: { $gte: searchDate, $lt: nextDate }
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        alreadyMarked: true,
        data: existing
      });
    }

    // If not marked, fetch all active students in class/section
    const students = await Student.find({
      currentSession: session,
      currentClass: className.toUpperCase(),
      currentSection: sectionName.toUpperCase(),
      isActive: true
    }).sort({ currentRollNo: 1 });

    const defaultRecords = students.map((s) => ({
      student: s._id,
      admissionNo: s.admissionNo,
      rollNo: s.currentRollNo,
      studentName: s.studentName,
      mobileNo: s.mobileNo || s.phone || '',
      status: 'PRESENT',
      remarks: ''
    }));

    res.status(200).json({
      success: true,
      alreadyMarked: false,
      data: {
        academicSession: session,
        className,
        sectionName,
        subjectCode: targetSubjectCode,
        subjectName: targetSubjectCode === 'DAILY' ? 'Daily Roll Call / दैनिक उपस्थिति' : targetSubjectCode,
        date: searchDate,
        totalStudents: defaultRecords.length,
        presentCount: defaultRecords.length,
        absentCount: 0,
        lateCount: 0,
        records: defaultRecords
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Submit daily or subject-wise attendance
// @route   POST /api/attendance/daily
exports.submitDailyAttendance = async (req, res, next) => {
  try {
    const { academicSession, className, sectionName, date, records, subjectCode, subjectName } = req.body;

    if (!records || !records.length) {
      return res.status(400).json({ success: false, message: 'Attendance records are required' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const targetSubjectCode = (subjectCode || 'DAILY').toUpperCase();
    const targetSubjectName = subjectName || (targetSubjectCode === 'DAILY' ? 'Daily Roll Call / दैनिक उपस्थिति' : targetSubjectCode);

    // Strict Teacher Authorization: If logged in as TEACHER, verify allocation
    if (req.user && req.user.role === 'TEACHER') {
      const staffRecord = await Staff.findOne({
        $or: [{ userId: req.user._id }, { email: req.user.email }]
      });

      if (!staffRecord) {
        return res.status(403).json({
          success: false,
          message: 'कोई शिक्षक प्रोफ़ाइल नहीं मिली (Teacher staff record not found).'
        });
      }

      // Check allocations for this teacher in this session, class, and section
      const allocations = await TeacherAllocation.find({
        teacher: staffRecord._id,
        academicSession: academicSession || '2025-26',
        className: className.toUpperCase(),
        sectionName: sectionName.toUpperCase()
      });

      if (!allocations || allocations.length === 0) {
        return res.status(403).json({
          success: false,
          message: `आप कक्षा ${className}-${sectionName} की उपस्थिति दर्ज करने के लिए अधिकृत नहीं हैं (You are not allocated to this class).`
        });
      }

      if (targetSubjectCode !== 'DAILY') {
        const isSubjectAllocated = allocations.some(
          (a) => a.subjectCode.toUpperCase() === targetSubjectCode
        );
        if (!isSubjectAllocated) {
          return res.status(403).json({
            success: false,
            message: `आप केवल अपने आवंटित विषय (${targetSubjectName}) की ही उपस्थिति दर्ज कर सकते हैं (You can only mark attendance for your assigned subject).`
          });
        }
      }
    }

    // Sanitize records to ensure student, admissionNo, rollNo, studentName and mobileNo are present
    const sanitizedRecords = await Promise.all(records.map(async (r) => {
      const sId = r.student || r.studentId || r._id;
      let admNo = r.admissionNo;
      let sRoll = r.rollNo;
      let sName = r.studentName;
      let sMobile = r.mobileNo;

      if (!admNo || !sName || !sRoll || !sMobile) {
        const sDoc = await Student.findById(sId);
        if (sDoc) {
          admNo = admNo || sDoc.admissionNo;
          sRoll = sRoll || sDoc.currentRollNo;
          sName = sName || sDoc.studentName;
          sMobile = sMobile || sDoc.mobileNo || '';
        }
      }

      return {
        student: sId,
        admissionNo: admNo || 'N/A',
        rollNo: sRoll || '1',
        studentName: sName || 'Student',
        mobileNo: sMobile || '',
        status: r.status || 'PRESENT',
        remarks: r.remarks || ''
      };
    }));

    const presentCount = sanitizedRecords.filter((r) => r.status === 'PRESENT').length;
    const absentCount = sanitizedRecords.filter((r) => r.status === 'ABSENT').length;
    const lateCount = sanitizedRecords.filter((r) => r.status === 'LATE' || r.status === 'HALF_DAY').length;

    const attendance = await Attendance.findOneAndUpdate(
      {
        academicSession,
        className: className.toUpperCase(),
        sectionName: sectionName.toUpperCase(),
        subjectCode: targetSubjectCode,
        date: attendanceDate
      },
      {
        academicSession,
        className: className.toUpperCase(),
        sectionName: sectionName.toUpperCase(),
        subjectCode: targetSubjectCode,
        subjectName: targetSubjectName,
        date: attendanceDate,
        totalStudents: sanitizedRecords.length,
        presentCount,
        absentCount,
        lateCount,
        records: sanitizedRecords,
        takenBy: req.user ? req.user._id : null,
        takenByName: req.user ? req.user.name : 'Teacher'
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `Attendance marked for ${className}-${sectionName} [${targetSubjectName}] (${presentCount}/${records.length} Present)`,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get class attendance analytics
// @route   GET /api/attendance/analytics
exports.getAttendanceAnalytics = async (req, res, next) => {
  try {
    const { session, className, sectionName } = req.query;
    let query = {};
    if (session) query.academicSession = session;
    if (className) query.className = className.toUpperCase();
    if (sectionName) query.sectionName = sectionName.toUpperCase();

    const attendances = await Attendance.find(query).sort({ date: -1 }).limit(30);

    const totalDays = attendances.length;
    let totalPresent = 0;
    let totalStudentsTracked = 0;

    attendances.forEach((a) => {
      totalPresent += a.presentCount || 0;
      totalStudentsTracked += a.totalStudents || 0;
    });

    const averagePercentage =
      totalStudentsTracked > 0 ? ((totalPresent / totalStudentsTracked) * 100).toFixed(1) : null;

    res.status(200).json({
      success: true,
      data: {
        totalDaysRecorded: totalDays,
        averagePercentage,
        recentSessions: attendances
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student attendance history
// @route   GET /api/attendance/student/:studentId
exports.getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { session } = req.query;

    let query = { 'records.student': studentId };
    if (session) query.academicSession = session;

    const attendances = await Attendance.find(query).sort({ date: -1 });

    const studentRecords = [];
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    attendances.forEach((att) => {
      const match = att.records.find((r) => String(r.student) === String(studentId));
      if (match) {
        studentRecords.push({
          date: att.date,
          status: match.status,
          remarks: match.remarks
        });
        if (match.status === 'PRESENT') presentCount++;
        else if (match.status === 'ABSENT') absentCount++;
        else lateCount++;
      }
    });

    const totalDays = studentRecords.length;
    const attendancePercentage = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) : null;

    res.status(200).json({
      success: true,
      data: {
        totalDays,
        presentCount,
        absentCount,
        lateCount,
        attendancePercentage,
        records: studentRecords
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get teacher's own class & subject allocations (for smart auto-fill and restriction)
// @route   GET /api/attendance/my-class
exports.getMyClassAllocation = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const email = req.user ? req.user.email : null;
    const session = req.query.session;

    // Find the staff record linked to this user by userId or email
    const staffRecord = await Staff.findOne({
      $or: [
        ...(userId ? [{ userId }] : []),
        ...(email ? [{ email }] : [])
      ]
    });

    if (!staffRecord) {
      return res.status(200).json({
        success: true,
        data: { found: false, allocations: [], message: 'No staff record linked to this account' }
      });
    }

    // Look for all class and subject allocations for this teacher
    const query = { teacher: staffRecord._id, ...(session ? { academicSession: session } : {}) };
    const allAllocations = await TeacherAllocation.find(query).sort({ className: 1, sectionName: 1 });

    if (!allAllocations.length) {
      return res.status(200).json({
        success: true,
        data: { found: false, allocations: [], message: 'No class allocation found for this teacher' }
      });
    }

    // Prefer isClassTeacher = true for primary class
    const classTeacherAlloc = allAllocations.find((a) => a.isClassTeacher);
    const primary = classTeacherAlloc || allAllocations[0];

    const allocationsList = allAllocations.map((a) => ({
      className: a.className,
      sectionName: a.sectionName,
      subjectCode: a.subjectCode,
      subjectName: a.subjectName,
      isClassTeacher: !!a.isClassTeacher
    }));

    return res.status(200).json({
      success: true,
      data: {
        found: true,
        isClassTeacher: !!classTeacherAlloc,
        primaryClass: primary.className,
        primarySection: primary.sectionName,
        primarySubjectCode: primary.subjectCode,
        primarySubjectName: primary.subjectName,
        teacherName: staffRecord.fullName,
        allocations: allocationsList
      }
    });
  } catch (error) {
    next(error);
  }
};
