const { getExaminationAnalytics } = require('../services/analyticsService');
const Student = require('../models/Student');
const Result = require('../models/Result');
const Examination = require('../models/Examination');

exports.getAnalytics = async (req, res, next) => {
  try {
    const { examinationId, className, sectionName } = req.query;

    if (!examinationId) {
      // Return global dashboard stats
      const totalStudents = await Student.countDocuments({ isActive: true });
      const totalExams = await Examination.countDocuments();
      const totalPublishedResults = await Result.countDocuments({ isPublished: true });
      const pendingApprovalCount = await Result.countDocuments({ isPublished: false });

      return res.status(200).json({
        success: true,
        data: {
          totalStudents,
          totalExams,
          totalPublishedResults,
          pendingApprovalCount
        }
      });
    }

    const analytics = await getExaminationAnalytics(examinationId, className, sectionName);
    res.status(200).json({ success: true, data: analytics });
  } catch (err) { next(err); }
};
