const Certificate = require('../models/Certificate');
const Student = require('../models/Student');

// @desc    Get all issued certificates
// @route   GET /api/certificates
exports.getCertificates = async (req, res, next) => {
  try {
    const { session, type, search } = req.query;
    let query = {};
    if (session) query.academicSession = session;
    if (type) query.certificateType = type;
    if (search) {
      query.$or = [
        { certificateNo: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
        { admissionNo: { $regex: search, $options: 'i' } }
      ];
    }

    const certificates = await Certificate.find(query).sort({ issueDate: -1 });
    res.status(200).json({ success: true, count: certificates.length, data: certificates });
  } catch (error) {
    next(error);
  }
};

// @desc    Issue new Certificate (TC, Bonafide, Character, Fee Dues)
// @route   POST /api/certificates
exports.issueCertificate = async (req, res, next) => {
  try {
    const { studentId, certificateType, academicSession, reasonForLeaving, conduct, feeClearedTill, customDetails } =
      req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Generate Certificate No: TC-2025-001 or BON-2025-001
    const prefix = certificateType === 'TRANSFER_CERTIFICATE' ? 'TC' : certificateType.substring(0, 3);
    const count = await Certificate.countDocuments({ certificateType });
    const sessionYear = (academicSession || student.currentSession).split('-')[0] || '2026';
    const certificateNo = `${prefix}-${sessionYear}-${String(count + 1).padStart(4, '0')}`;

    const cert = await Certificate.create({
      certificateNo,
      certificateType,
      student: student._id,
      studentName: student.studentName,
      admissionNo: student.admissionNo,
      academicSession: academicSession || student.currentSession,
      className: student.currentClass,
      sectionName: student.currentSection,
      reasonForLeaving: reasonForLeaving || '',
      conduct: conduct || 'Good',
      feeClearedTill: feeClearedTill || '',
      customDetails: customDetails || {},
      issuedBy: req.user ? req.user._id : null,
      issuedByName: req.user ? req.user.name : 'Principal'
    });

    res.status(201).json({
      success: true,
      message: `${certificateType} issued successfully (${certificateNo})`,
      data: cert
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Certificate Details by ID
// @route   GET /api/certificates/:id
exports.getCertificateById = async (req, res, next) => {
  try {
    const cert = await Certificate.findById(req.params.id).populate('student');
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    res.status(200).json({ success: true, data: cert });
  } catch (error) {
    next(error);
  }
};
