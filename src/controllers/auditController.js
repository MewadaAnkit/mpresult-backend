const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { module, action, studentAdmissionNo, limit = 100 } = req.query;
    const query = {};

    if (module) query.module = module;
    if (action) query.action = action;
    if (studentAdmissionNo) query.studentAdmissionNo = studentAdmissionNo.toUpperCase();

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (err) { next(err); }
};
