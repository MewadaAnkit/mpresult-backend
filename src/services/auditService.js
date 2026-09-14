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
    const ipAddress = req?.headers ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') : (req?.ip || '');
    const userAgent = req?.headers ? req.headers['user-agent'] || '' : '';

    await AuditLog.create({
      userId: actorUser ? actorUser._id : null,
      userName: actorUser?.name || 'SYSTEM',
      userRole: actorUser?.role || 'ADMIN',
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
