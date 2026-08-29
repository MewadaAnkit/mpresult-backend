const Timetable = require('../models/Timetable');

// @desc    Get timetable for a class & section or entire week
// @route   GET /api/timetable
exports.getTimetable = async (req, res, next) => {
  try {
    const { session, className, sectionName, dayOfWeek } = req.query;
    if (!session || !className || !sectionName) {
      return res.status(400).json({ success: false, message: 'Session, Class and Section are required' });
    }

    let query = {
      academicSession: session,
      className: className.toUpperCase(),
      sectionName: sectionName.toUpperCase()
    };
    if (dayOfWeek) query.dayOfWeek = dayOfWeek.toUpperCase();

    const timetable = await Timetable.find(query).sort({ dayOfWeek: 1 });
    res.status(200).json({ success: true, count: timetable.length, data: timetable });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Update timetable for a day
// @route   POST /api/timetable
exports.saveDayTimetable = async (req, res, next) => {
  try {
    const { academicSession, className, sectionName, dayOfWeek, periods } = req.body;

    const timetable = await Timetable.findOneAndUpdate(
      {
        academicSession,
        className: className.toUpperCase(),
        sectionName: sectionName.toUpperCase(),
        dayOfWeek: dayOfWeek.toUpperCase()
      },
      {
        academicSession,
        className: className.toUpperCase(),
        sectionName: sectionName.toUpperCase(),
        dayOfWeek: dayOfWeek.toUpperCase(),
        periods
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `Timetable updated for ${className}-${sectionName} (${dayOfWeek})`,
      data: timetable
    });
  } catch (error) {
    next(error);
  }
};
