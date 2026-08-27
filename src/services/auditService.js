const AuditLog = require('../models/AuditLog');

/**
 * Log a critical action in the system audit trail
 */
const logAction = async ({
  req,
  user,
  action,
  module,
  resourceId = '',
  studentAdmissionNo = '',
  studentName = '',
  description,
  oldValues = null,
  newValues = null
}) => {
  try {
    const actorUser = user || (req && req.user);
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') : '';
    const userAgent = req ? req.headers['user-agent'] || '' : '';

    await AuditLog.create({
      userId: actorUser ? actorUser._id : null,
      userName: actorUser ? actorUser.name : 'SYSTEM',
      userRole: actorUser ? actorUser.role : 'SYSTEM',
      action,
      module,
      resourceId: resourceId ? String(resourceId) : '',
      studentAdmissionNo,
      studentName,
      description,
      oldValues,
      newValues,
      ipAddress,
      userAgent
    });
  } catch (error) {
    console.error('[MP-RMS AuditService Error]:', error.message);
  }
};

module.exports = {
  logAction
};
