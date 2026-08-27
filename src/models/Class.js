const mongoose = require('mongoose');
const { CLASS_MODES } = require('../constants/examinationTypes');

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: [true, 'Class name/number is required (e.g. 1, 5, 9, 11)'],
      unique: true,
      trim: true,
      uppercase: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    numericLevel: {
      type: Number,
      required: true
    },
    classMode: {
      type: String,
      enum: Object.values(CLASS_MODES),
      required: true,
      default: CLASS_MODES.PRIMARY_SCHOOL
    },
    hasStreams: {
      type: Boolean,
      default: false
    },
    isExternalBoard: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
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

module.exports = mongoose.model('Class', classSchema);
