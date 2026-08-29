const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    certificateType: {
      type: String,
      enum: ['TRANSFER_CERTIFICATE', 'BONAFIDE', 'CHARACTER', 'FEE_DUES', 'STUDY_CERTIFICATE', 'CUSTOM'],
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    studentName: {
      type: String,
      required: true,
      trim: true
    },
    admissionNo: {
      type: String,
      required: true,
      trim: true
    },
    academicSession: {
      type: String,
      required: true,
      trim: true
    },
    className: {
      type: String,
      required: true,
      trim: true
    },
    sectionName: {
      type: String,
      trim: true,
      default: ''
    },
    reasonForLeaving: {
      type: String,
      trim: true,
      default: ''
    },
    conduct: {
      type: String,
      trim: true,
      default: 'Good'
    },
    feeClearedTill: {
      type: String,
      trim: true,
      default: ''
    },
    customDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    issuedByName: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['ISSUED', 'REVOKED'],
      default: 'ISSUED'
    }
  },
  {
    timestamps: true
  }
);

certificateSchema.index({ student: 1, certificateType: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);
