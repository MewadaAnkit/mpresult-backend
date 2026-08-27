const Settings = require('../models/Settings');
const { logAction } = require('../services/auditService');

exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.status(200).json({ success: true, data: settings });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ ...req.body, updatedBy: req.user._id });
    } else {
      Object.assign(settings, req.body);
      settings.updatedBy = req.user._id;
      await settings.save();
    }

    await logAction({
      req,
      action: 'UPDATE_SETTINGS',
      module: 'SETTINGS',
      description: 'Updated school settings, MPBSE affiliation, and branding'
    });

    res.status(200).json({ success: true, data: settings });
  } catch (err) { next(err); }
};
