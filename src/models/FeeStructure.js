const mongoose = require('mongoose');

const feeItemSchema = new mongoose.Schema(
  {
    feeHead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeHead',
      required: true
    },
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

const installmentSchema = new mongoose.Schema(
  {
    installmentName: {
      type: String,
      required: true, // e.g. "Term 1 (April)", "Term 2 (August)", etc.
      trim: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    items: [feeItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const feeStructureSchema = new mongoose.Schema(
  {
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
    title: {
      type: String,
      required: true,
      trim: true
    },
    installments: [installmentSchema],
    annualTotal: {
      type: Number,
      required: true,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

feeStructureSchema.index({ academicSession: 1, className: 1 }, { unique: true });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
