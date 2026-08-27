const Subject = require('../models/Subject');
const SubjectCombination = require('../models/SubjectCombination');

exports.getSubjects = async (req, res, next) => {
  try {
    const { className, streamName } = req.query;
    const query = { isActive: true };
    if (className) query.applicableClasses = className.toUpperCase();
    if (streamName) query.streamName = streamName;

    const subjects = await Subject.find(query).sort({ displayOrder: 1, subjectName: 1 });
    res.status(200).json({ success: true, count: subjects.length, data: subjects });
  } catch (err) { next(err); }
};

exports.createSubject = async (req, res, next) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, data: subject });
  } catch (err) { next(err); }
};

exports.updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.status(200).json({ success: true, data: subject });
  } catch (err) { next(err); }
};

// --- Subject Combinations (Class 11, etc.) ---
exports.getCombinations = async (req, res, next) => {
  try {
    const { className } = req.query;
    const query = { isActive: true };
    if (className) query.className = className.toUpperCase();

    const combinations = await SubjectCombination.find(query)
      .populate('compulsorySubjects')
      .populate('electiveSubjects')
      .populate('additionalSubjects');

    res.status(200).json({ success: true, data: combinations });
  } catch (err) { next(err); }
};

exports.createCombination = async (req, res, next) => {
  try {
    const combination = await SubjectCombination.create(req.body);
    res.status(201).json({ success: true, data: combination });
  } catch (err) { next(err); }
};
