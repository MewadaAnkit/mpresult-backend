const Examination = require('../models/Examination');
const { logAction } = require('../services/auditService');

exports.getExaminations = async (req, res, next) => {
  try {
    const { sessionName, className } = req.query;
    const query = {};
    if (sessionName) query.sessionName = sessionName;
    if (className) query.applicableClasses = className.toUpperCase();

    const exams = await Examination.find(query)
      .populate('schemeId')
      .sort({ startDate: -1, createdAt: -1 });

    res.status(200).json({ success: true, count: exams.length, data: exams });
  } catch (err) { next(err); }
};

exports.getExaminationById = async (req, res, next) => {
  try {
    const exam = await Examination.findById(req.params.id).populate('schemeId');
    if (!exam) return res.status(404).json({ success: false, message: 'Examination not found' });
    res.status(200).json({ success: true, data: exam });
  } catch (err) { next(err); }
};

exports.createExamination = async (req, res, next) => {
  try {
    const exam = await Examination.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: exam });
  } catch (err) { next(err); }
};

exports.toggleMarksLock = async (req, res, next) => {
  try {
    const exam = await Examination.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Examination not found' });

    exam.isMarksEntryLocked = !exam.isMarksEntryLocked;
    await exam.save();

    await logAction({
      req,
      action: exam.isMarksEntryLocked ? 'LOCK_EXAMS' : 'UNLOCK_EXAMS',
      module: 'MARKS',
      description: `${exam.isMarksEntryLocked ? 'Locked' : 'Unlocked'} marks entry for examination: ${exam.examName}`
    });

    res.status(200).json({
      success: true,
      message: `Marks entry is now ${exam.isMarksEntryLocked ? 'LOCKED' : 'UNLOCKED'}`,
      isMarksEntryLocked: exam.isMarksEntryLocked
    });
  } catch (err) { next(err); }
};

exports.updateExamination = async (req, res, next) => {
  try {
    const exam = await Examination.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('schemeId');
    if (!exam) return res.status(404).json({ success: false, message: 'Examination not found' });
    res.status(200).json({ success: true, data: exam });
  } catch (err) { next(err); }
};

exports.deleteExamination = async (req, res, next) => {
  try {
    const exam = await Examination.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Examination not found' });

    const Marks = require('../models/Marks');
    const marksCount = await Marks.countDocuments({ examinationId: req.params.id });
    if (marksCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete "${exam.examName}" because ${marksCount} student marks are already recorded for it.`
      });
    }

    await Examination.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: `Examination "${exam.examName}" deleted successfully.` });
  } catch (err) { next(err); }
};
