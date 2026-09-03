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
    const { applicableClasses, ...rest } = req.body;
    
    // If multiple classes are selected, create an independent subject record for each class
    // so that updating or deleting in one class never affects other classes!
    if (Array.isArray(applicableClasses) && applicableClasses.length > 1) {
      const createdSubjects = [];
      for (const cls of applicableClasses) {
        const clsSuffix = String(cls).padStart(2, '0');
        const code = rest.subjectCode.includes(clsSuffix) ? rest.subjectCode : `${rest.subjectCode}_${clsSuffix}`;
        
        // Ensure uniqueness
        const exists = await Subject.findOne({ subjectCode: code });
        const finalCode = exists ? `${rest.subjectCode}_C${cls}` : code;

        const sub = await Subject.create({
          ...rest,
          subjectCode: finalCode,
          applicableClasses: [cls]
        });
        createdSubjects.push(sub);
      }
      return res.status(201).json({ success: true, count: createdSubjects.length, data: createdSubjects[0] });
    }

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

exports.deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const { className } = req.query;

    // If viewing a specific class and the subject happens to be shared across multiple classes,
    // only unlink it from this class so other classes are completely protected!
    if (className && className !== 'ALL' && subject.applicableClasses.length > 1 && subject.applicableClasses.includes(className)) {
      subject.applicableClasses = subject.applicableClasses.filter(c => c !== className);
      await subject.save();
      return res.status(200).json({ 
        success: true, 
        message: `Subject "${subject.subjectName}" removed from Class ${className} successfully.` 
      });
    }

    // Safety check: Prevent full deletion if student marks are already recorded
    const Marks = require('../models/Marks');
    const marksCount = await Marks.countDocuments({ subjectId: req.params.id });
    if (marksCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete "${subject.subjectName}" because ${marksCount} marks entry(s) are already linked to this subject.`
      });
    }

    await Subject.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: `Subject "${subject.subjectName}" deleted successfully.` });
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
    const populated = await SubjectCombination.findById(combination._id)
      .populate('compulsorySubjects')
      .populate('electiveSubjects')
      .populate('additionalSubjects');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
};

exports.updateCombination = async (req, res, next) => {
  try {
    const combination = await SubjectCombination.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('compulsorySubjects')
      .populate('electiveSubjects')
      .populate('additionalSubjects');

    if (!combination) {
      return res.status(404).json({ success: false, message: 'Subject combination not found' });
    }
    res.status(200).json({ success: true, data: combination });
  } catch (err) { next(err); }
};

exports.deleteCombination = async (req, res, next) => {
  try {
    const combination = await SubjectCombination.findByIdAndDelete(req.params.id);
    if (!combination) {
      return res.status(404).json({ success: false, message: 'Subject combination not found' });
    }
    res.status(200).json({ success: true, message: 'Subject combination deleted successfully' });
  } catch (err) { next(err); }
};
