const mongoose = require('mongoose');

const feeHeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Fee head name is required'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    isOptional: {
      type: Boolean,
      default: false
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

module.exports = mongoose.model('FeeHead', feeHeadSchema);
