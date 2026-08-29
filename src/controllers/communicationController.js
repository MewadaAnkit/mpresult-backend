const Announcement = require('../models/Announcement');

// @desc    Get announcements with optional audience filter
// @route   GET /api/communication/announcements
exports.getAnnouncements = async (req, res, next) => {
  try {
    const { session, audience, className } = req.query;
    let query = { isActive: true };
    if (session) query.academicSession = session;
    if (audience && audience !== 'ALL') {
      query.audience = { $in: ['ALL', audience] };
    }
    if (className) {
      query.$or = [{ audience: 'ALL' }, { targetClasses: className.toUpperCase() }];
    }

    const announcements = await Announcement.find(query).sort({ priority: -1, publishDate: -1 });
    res.status(200).json({ success: true, count: announcements.length, data: announcements });
  } catch (error) {
    next(error);
  }
};

// @desc    Create announcement
// @route   POST /api/communication/announcements
exports.createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      author: req.user ? req.user._id : null,
      authorName: req.user ? req.user.name : 'School Administration'
    });
    res.status(201).json({
      success: true,
      message: 'Announcement published',
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete announcement
// @route   DELETE /api/communication/announcements/:id
exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    res.status(200).json({ success: true, message: 'Announcement removed' });
  } catch (error) {
    next(error);
  }
};
