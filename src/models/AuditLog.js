const mongoose = require('mongoose');
const { AUDIT_ACTIONS } = require('../constants/auditActions');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: {
      type: String,
      required: true
    },
    userRole: {
      type: String,
      required: true
    },
    action: {
      type: String,
      enum: Object.values(AUDIT_ACTIONS),
      required: true
    },
    module: {
      type: String,
      required: true // 'STUDENTS', 'MARKS', 'SCHEMES', 'RESULTS', 'EXTERNAL', 'SETTINGS', 'AUTH'
    },
    resourceId: {
      type: String,
      default: ''
    },
    studentAdmissionNo: {
      type: String,
      default: ''
    },
    studentName: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      required: true
    },
    oldValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ studentAdmissionNo: 1 });
auditLogSchema.index({ userId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
