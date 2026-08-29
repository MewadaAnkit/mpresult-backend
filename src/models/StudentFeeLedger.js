const mongoose = require('mongoose');

const studentFeeLedgerSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    admissionNo: {
      type: String,
      required: true,
      trim: true
    },
    studentName: {
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
      trim: true,
      uppercase: true
    },
    sectionName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    totalFee: {
      type: Number,
      required: true,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    discountReason: {
      type: String,
      trim: true,
      default: ''
    },
    netFee: {
      type: Number,
      required: true,
      default: 0
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    balanceAmount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'OVERDUE', 'PENDING'],
      default: 'PENDING'
    },
    lastPaymentDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

studentFeeLedgerSchema.index({ student: 1, academicSession: 1 }, { unique: true });
studentFeeLedgerSchema.index({ academicSession: 1, className: 1, status: 1 });

module.exports = mongoose.model('StudentFeeLedger', studentFeeLedgerSchema);
