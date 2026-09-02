const Staff = require('../models/Staff');
const User = require('../models/User');
const TeacherAllocation = require('../models/TeacherAllocation');

// @desc    Get all staff members
// @route   GET /api/staff
exports.getStaffList = async (req, res, next) => {
  try {
    const { department, search } = req.query;
    let query = {};
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }
    const staff = await Staff.find(query).sort({ employeeId: 1 });
    res.status(200).json({ success: true, count: staff.length, data: staff });
  } catch (error) {
    next(error);
  }
};

// @desc    Create staff member
// @route   POST /api/staff
exports.createStaff = async (req, res, next) => {
  try {
    const { fullName, phone, designation, department, email, qualification, experienceYears } = req.body;

    // Server-side validation
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full Name is required' });
    }
    const cleanFullName = fullName.replace(/<[^>]*>?/gm, '').trim();
    if (cleanFullName.length < 2) {
      return res.status(400).json({ success: false, message: 'Full Name must be at least 2 characters' });
    }
    if (!/^[a-zA-Z\u0900-\u097F\s.'-]+$/.test(cleanFullName)) {
      return res.status(400).json({ success: false, message: 'Full Name contains invalid characters. Only letters, spaces, and dots are allowed.' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone Number is required' });
    }
    const cleanPhone = phone.trim().replace(/[\s-+]/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number starting with 6, 7, 8, or 9' });
    }

    if (!designation || !designation.trim()) {
      return res.status(400).json({ success: false, message: 'Designation is required' });
    }

    const count = await Staff.countDocuments();
    const employeeId = `EMP-${String(count + 1).padStart(4, '0')}`;

    const staff = await Staff.create({
      ...req.body,
      fullName: cleanFullName,
      phone: cleanPhone,
      designation: designation.replace(/<[^>]*>?/gm, '').trim(),
      qualification: qualification ? qualification.replace(/<[^>]*>?/gm, '').trim() : '',
      employeeId
    });

    res.status(201).json({
      success: true,
      message: 'Staff member added successfully',
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update staff member
// @route   PUT /api/staff/:id
exports.updateStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.status(200).json({ success: true, message: 'Staff updated successfully', data: staff });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Deactivate staff member
// @route   DELETE /api/staff/:id
exports.deleteStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    await TeacherAllocation.deleteMany({ teacher: staff._id });
    res.status(200).json({ success: true, message: 'Staff member removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get teacher allocations
// @route   GET /api/staff/allocations
exports.getAllocations = async (req, res, next) => {
  try {
    const { session, className, teacherId } = req.query;
    let query = {};
    if (session) query.academicSession = session;
    if (className) query.className = className;
    if (teacherId) query.teacher = teacherId;

    const allocations = await TeacherAllocation.find(query).sort({ className: 1, sectionName: 1 });
    res.status(200).json({ success: true, count: allocations.length, data: allocations });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Assign teacher allocation
// @route   POST /api/staff/allocations
exports.saveAllocation = async (req, res, next) => {
  try {
    const { academicSession, teacherId, teacherName, className, sectionName, subjectCode, subjectName, isClassTeacher } = req.body;

    const allocation = await TeacherAllocation.findOneAndUpdate(
      {
        academicSession,
        className: className.toUpperCase(),
        sectionName: sectionName.toUpperCase(),
        subjectCode: subjectCode.toUpperCase()
      },
      {
        academicSession,
        teacher: teacherId,
        teacherName,
        className: className.toUpperCase(),
        sectionName: sectionName.toUpperCase(),
        subjectCode: subjectCode.toUpperCase(),
        subjectName,
        isClassTeacher: !!isClassTeacher
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Teacher subject allocation saved',
      data: allocation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove allocation
// @route   DELETE /api/staff/allocations/:id
exports.deleteAllocation = async (req, res, next) => {
  try {
    await TeacherAllocation.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Allocation removed' });
  } catch (error) {
    next(error);
  }
};
