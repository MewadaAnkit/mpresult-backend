const AdmissionInquiry = require('../models/AdmissionInquiry');
const Student = require('../models/Student');
const StudentEnrollment = require('../models/StudentEnrollment');

// @desc    Get all inquiries with optional status/session filter
// @route   GET /api/admissions/inquiries
exports.getInquiries = async (req, res, next) => {
  try {
    const { session, status, search, className } = req.query;
    let query = {};

    if (session) query.academicSession = session;
    if (status) query.status = status;
    if (className) query.appliedClass = className;
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { inquiryNo: { $regex: search, $options: 'i' } },
        { guardianPhone: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } }
      ];
    }

    const inquiries = await AdmissionInquiry.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new inquiry
// @route   POST /api/admissions/inquiries
exports.createInquiry = async (req, res, next) => {
  try {
    const { academicSession, appliedClass } = req.body;
    
    // Generate inquiry number: INQ-2025-001
    const count = await AdmissionInquiry.countDocuments({ academicSession });
    const sessionYear = academicSession.split('-')[0] || '2026';
    const inquiryNo = `INQ-${sessionYear}-${String(count + 1).padStart(4, '0')}`;

    const inquiry = await AdmissionInquiry.create({
      ...req.body,
      inquiryNo,
      createdBy: req.user ? req.user._id : null
    });

    res.status(201).json({
      success: true,
      message: 'Admission inquiry created successfully',
      data: inquiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update inquiry status or details
// @route   PUT /api/admissions/inquiries/:id
exports.updateInquiry = async (req, res, next) => {
  try {
    const inquiry = await AdmissionInquiry.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Inquiry updated successfully',
      data: inquiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add follow-up note
// @route   POST /api/admissions/inquiries/:id/notes
exports.addNote = async (req, res, next) => {
  try {
    const { text } = req.body;
    const inquiry = await AdmissionInquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    inquiry.notes.push({
      text,
      addedBy: req.user ? req.user.name : 'Staff',
      createdAt: new Date()
    });
    await inquiry.save();

    res.status(200).json({
      success: true,
      message: 'Follow-up note logged',
      data: inquiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Convert inquiry into enrolled student
// @route   POST /api/admissions/inquiries/:id/convert
exports.convertInquiryToStudent = async (req, res, next) => {
  try {
    const inquiry = await AdmissionInquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    const { admissionNo, section, rollNo, samagraId, mpBseRollNo, stream } = req.body;

    // Check admissionNo uniqueness
    const existing = await Student.findOne({ admissionNo: admissionNo.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Admission number already exists in system' });
    }

    const newStudent = await Student.create({
      admissionNo: admissionNo.toUpperCase(),
      samagraId: samagraId || '',
      mpBseRollNo: mpBseRollNo || '',
      studentName: inquiry.studentName,
      fatherName: inquiry.fatherName,
      motherName: inquiry.motherName,
      dob: inquiry.dob,
      gender: inquiry.gender,
      mobileNo: inquiry.guardianPhone,
      email: inquiry.guardianEmail,
      address: inquiry.address,
      currentSession: inquiry.academicSession,
      currentClass: inquiry.appliedClass,
      currentSection: section ? section.toUpperCase() : 'A',
      currentRollNo: rollNo || '1',
      currentStream: stream || '',
      createdBy: req.user ? req.user._id : null
    });

    await StudentEnrollment.create({
      student: newStudent._id,
      admissionNo: newStudent.admissionNo,
      session: inquiry.academicSession,
      class: inquiry.appliedClass,
      section: newStudent.currentSection,
      rollNo: newStudent.currentRollNo,
      stream: newStudent.currentStream,
      status: 'ACTIVE'
    });

    inquiry.status = 'ADMITTED';
    inquiry.admittedStudentId = newStudent._id;
    await inquiry.save();

    res.status(200).json({
      success: true,
      message: `Inquiry successfully converted to Student (${newStudent.studentName} - ${newStudent.admissionNo})`,
      data: newStudent
    });
  } catch (error) {
    next(error);
  }
};
