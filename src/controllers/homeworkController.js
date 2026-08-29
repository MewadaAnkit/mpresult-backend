const Homework = require('../models/Homework');

// @desc    Get homework by session, class & section
// @route   GET /api/homework
exports.getHomeworkList = async (req, res, next) => {
  try {
    const { session, className, sectionName } = req.query;
    let query = {};
    if (session) query.academicSession = session;
    if (className) query.className = className.toUpperCase();
    if (sectionName) query.sectionName = sectionName.toUpperCase();

    const list = await Homework.find(query).sort({ dueDate: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new homework assignment
// @route   POST /api/homework
exports.createHomework = async (req, res, next) => {
  try {
    const homework = await Homework.create({
      ...req.body,
      className: req.body.className.toUpperCase(),
      sectionName: req.body.sectionName.toUpperCase(),
      assignedBy: req.user ? req.user._id : null,
      assignedByName: req.user ? req.user.name : 'Teacher'
    });

    res.status(201).json({
      success: true,
      message: 'Homework posted successfully',
      data: homework
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete homework assignment
// @route   DELETE /api/homework/:id
exports.deleteHomework = async (req, res, next) => {
  try {
    const homework = await Homework.findByIdAndDelete(req.params.id);
    if (!homework) {
      return res.status(404).json({ success: false, message: 'Homework not found' });
    }
    res.status(200).json({ success: true, message: 'Homework deleted' });
  } catch (error) {
    next(error);
  }
};
