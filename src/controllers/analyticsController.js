const { getExaminationAnalytics } = require('../services/analyticsService');
const Student = require('../models/Student');
const Result = require('../models/Result');
const Examination = require('../models/Examination');
const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');
const TeacherAllocation = require('../models/TeacherAllocation');
const Homework = require('../models/Homework');

exports.getAnalytics = async (req, res, next) => {
  try {
    const { examinationId, className, sectionName } = req.query;

    if (!examinationId) {
      const totalStudents = await Student.countDocuments({ isActive: true });
      const totalExams = await Examination.countDocuments();
      const totalPublishedResults = await Result.countDocuments({ isPublished: true });
      const pendingApprovalCount = await Result.countDocuments({ isPublished: false });

      return res.status(200).json({
        success: true,
        data: { totalStudents, totalExams, totalPublishedResults, pendingApprovalCount }
      });
    }

    const analytics = await getExaminationAnalytics(examinationId, className, sectionName);
    res.status(200).json({ success: true, data: analytics });
  } catch (err) { next(err); }
};

// @desc    Teacher's personalised dashboard data (real data)
// @route   GET /api/analytics/teacher-dashboard
exports.getTeacherDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const session = req.query.session || '2025-26';

    // Find staff record for this user
    const staffRecord = await Staff.findOne({ userId });
    if (!staffRecord) {
      return res.status(200).json({ success: true, data: { found: false } });
    }

    // Get all unique class-section combos for this teacher
    const allocs = await TeacherAllocation.find({
      teacher: staffRecord._id,
      academicSession: session
    });

    const uniqueCombos = [];
    const seen = new Set();
    allocs.forEach((a) => {
      const key = `${a.className}-${a.sectionName}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCombos.push({ className: a.className, sectionName: a.sectionName, isClassTeacher: !!a.isClassTeacher });
      }
    });

    // Check today's attendance for each class-section
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendanceStatus = await Promise.all(
      uniqueCombos.map(async (combo) => {
        const att = await Attendance.findOne({
          academicSession: session,
          className: combo.className.toUpperCase(),
          sectionName: combo.sectionName.toUpperCase(),
          date: { $gte: today, $lt: tomorrow }
        });
        return {
          ...combo,
          attendanceMarked: !!att,
          presentCount: att?.presentCount || 0,
          totalStudents: att?.totalStudents || 0,
          attendanceRate: att ? ((att.presentCount / att.totalStudents) * 100).toFixed(0) : null
        };
      })
    );

    // Count pending attendance (not marked today for any class)
    const pendingAttendanceCount = attendanceStatus.filter((a) => !a.attendanceMarked).length;

    // Count active homework posted by this teacher (due in future or today)
    let homeworkCount = 0;
    try {
      homeworkCount = await Homework.countDocuments({
        postedBy: staffRecord._id,
        dueDate: { $gte: today }
      });
    } catch (e) { /* homework model may not have postedBy */ }

    return res.status(200).json({
      success: true,
      data: {
        found: true,
        teacherName: staffRecord.fullName,
        designation: staffRecord.designation,
        primarySubject: staffRecord.primarySubject || '',
        classesSections: uniqueCombos,
        attendanceStatus,
        pendingAttendanceCount,
        totalClassesCount: uniqueCombos.length,
        homeworkCount,
        session
      }
    });
  } catch (err) { next(err); }
};

