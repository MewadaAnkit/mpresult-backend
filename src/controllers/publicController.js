const Result = require('../models/Result');
const Student = require('../models/Student');
const Examination = require('../models/Examination');
const Settings = require('../models/Settings');

/**
 * @desc    Public Search for published student result
 * @route   GET /api/public/search
 * @access  Public (Rate limited)
 */
exports.searchResult = async (req, res, next) => {
  try {
    const { rollNo, admissionNo, dob, sessionName, className } = req.query;

    if (!rollNo && !admissionNo) {
      return res.status(400).json({ success: false, message: 'Please provide Roll Number or Admission Number' });
    }

    const query = { isPublished: true };
    if (sessionName) query.sessionName = sessionName;
    if (className) query.className = className.toUpperCase();
    if (admissionNo) query.admissionNo = admissionNo.toUpperCase();
    if (rollNo) query.rollNo = rollNo;

    const result = await Result.findOne(query)
      .populate('studentId', 'studentName fatherName motherName dob samagraId')
      .populate('examinationId', 'examName sessionName');

    if (!result) {
      return res.status(404).json({ success: false, message: 'No published result found matching your details' });
    }

    // If DOB verification is provided, check DOB
    if (dob && result.studentId?.dob) {
      const inputDob = new Date(dob).toISOString().split('T')[0];
      const actualDob = new Date(result.studentId.dob).toISOString().split('T')[0];
      if (inputDob !== actualDob) {
        return res.status(401).json({ success: false, message: 'Date of Birth does not match student records' });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        studentName: result.studentId?.studentName,
        fatherName: result.studentId?.fatherName,
        admissionNo: result.admissionNo,
        rollNo: result.rollNo,
        className: result.className,
        sectionName: result.sectionName,
        sessionName: result.sessionName,
        streamName: result.streamName,
        examName: result.examinationId?.examName,
        subjectResults: result.subjectResults,
        grandTotalObtained: result.grandTotalObtained,
        grandTotalMax: result.grandTotalMax,
        overallPercentage: result.overallPercentage,
        overallGrade: result.overallGrade,
        division: result.division,
        resultStatus: result.resultStatus,
        verificationCode: result.verificationCode,
        publishedAt: result.publishedAt
      }
    });
  } catch (err) { next(err); }
};

/**
 * @desc    Public verification endpoint (QR code scan target)
 * @route   GET /api/public/verify/:code
 * @access  Public
 */
exports.verifyResult = async (req, res, next) => {
  try {
    const { code } = req.params;

    const result = await Result.findOne({ verificationCode: code.toUpperCase(), isPublished: true })
      .populate('studentId', 'studentName fatherName admissionNo')
      .populate('examinationId', 'examName sessionName');

    if (!result) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'Invalid verification code or result has not been published.'
      });
    }

    const settings = (await Settings.findOne()) || {};

    res.status(200).json({
      success: true,
      verified: true,
      data: {
        verificationCode: result.verificationCode,
        schoolName: settings.schoolName || 'Madhya Pradesh School',
        affiliationCode: settings.affiliationCode || 'MPBSE',
        studentName: result.studentId?.studentName,
        admissionNo: result.admissionNo,
        rollNo: result.rollNo,
        className: result.className,
        sectionName: result.sectionName,
        sessionName: result.sessionName,
        examName: result.examinationId?.examName,
        grandTotalObtained: result.grandTotalObtained,
        grandTotalMax: result.grandTotalMax,
        overallPercentage: result.overallPercentage,
        overallGrade: result.overallGrade,
        resultStatus: result.resultStatus,
        division: result.division,
        issuedDate: result.publishedAt || result.updatedAt
      }
    });
  } catch (err) { next(err); }
};
