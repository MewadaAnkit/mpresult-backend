const mongoose = require('mongoose');

const paymentItemSchema = new mongoose.Schema(
  {
    headName: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const feePaymentSchema = new mongoose.Schema(
  {
    receiptNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
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
      trim: true
    },
    sectionName: {
      type: String,
      required: true,
      trim: true
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 1
    },
    paymentMode: {
      type: String,
      enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE'],
      default: 'CASH'
    },
    transactionRef: {
      type: String,
      trim: true,
      default: ''
    },
    items: [paymentItemSchema],
    remarks: {
      type: String,
      trim: true,
      default: ''
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    collectedByName: {
      type: String,
      default: 'Accountant'
    },
    paymentDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

feePaymentSchema.index({ academicSession: 1, paymentDate: -1 });
feePaymentSchema.index({ student: 1 });

module.exports = mongoose.model('FeePayment', feePaymentSchema);
