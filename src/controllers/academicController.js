const AcademicSession = require('../models/AcademicSession');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Stream = require('../models/Stream');
const { logAction } = require('../services/auditService');

// --- Academic Sessions ---
exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await AcademicSession.find().sort({ startDate: -1 });
    res.status(200).json({ success: true, data: sessions });
  } catch (err) { next(err); }
};

exports.createSession = async (req, res, next) => {
  try {
    const { sessionName, startDate, endDate, isCurrent, description } = req.body;

    // BUG-025 FIX: Validate that endDate is after startDate
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const session = await AcademicSession.create({
      sessionName,
      startDate,
      endDate,
      isCurrent: isCurrent || false,
      description,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: session });
  } catch (err) { next(err); }
};

exports.setCurrentSession = async (req, res, next) => {
  try {
    const session = await AcademicSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    session.isCurrent = true;
    await session.save();
    res.status(200).json({ success: true, message: `Session ${session.sessionName} set as active`, data: session });
  } catch (err) { next(err); }
};

// --- Classes ---
exports.getClasses = async (req, res, next) => {
  try {
    const classes = await Class.find().sort({ numericLevel: 1, order: 1 });
    res.status(200).json({ success: true, data: classes });
  } catch (err) { next(err); }
};

exports.createClass = async (req, res, next) => {
  try {
    const newClass = await Class.create(req.body);
    res.status(201).json({ success: true, data: newClass });
  } catch (err) { next(err); }
};

// --- Sections ---
exports.getSections = async (req, res, next) => {
  try {
    const { className } = req.query;
    const query = {};
    if (className) query.className = className.toUpperCase();
    const sections = await Section.find(query).populate('classTeacher', 'name email').populate('streamId');
    res.status(200).json({ success: true, data: sections });
  } catch (err) { next(err); }
};

exports.createSection = async (req, res, next) => {
  try {
    const cls = await Class.findOne({ className: req.body.className.toUpperCase() });
    if (!cls) return res.status(404).json({ success: false, message: 'Parent class not found' });

    const section = await Section.create({
      ...req.body,
      classId: cls._id,
      className: cls.className,
      sectionName: req.body.sectionName.toUpperCase()
    });
    res.status(201).json({ success: true, data: section });
  } catch (err) { next(err); }
};

// --- Streams ---
exports.getStreams = async (req, res, next) => {
  try {
    const streams = await Stream.find({ isActive: true });
    res.status(200).json({ success: true, data: streams });
  } catch (err) { next(err); }
};

exports.createStream = async (req, res, next) => {
  try {
    const stream = await Stream.create(req.body);
    res.status(201).json({ success: true, data: stream });
  } catch (err) { next(err); }
};
