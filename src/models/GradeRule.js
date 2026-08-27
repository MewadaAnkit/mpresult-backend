const mongoose = require('mongoose');

const gradeBoundarySchema = new mongoose.Schema(
  {
    grade: {
      type: String,
      required: true,
      trim: true // e.g. "A1", "A+", "First Div", "Distinction"
    },
    minPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    maxPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    gradePoint: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      trim: true,
      default: '' // Outstanding, Excellent, Very Good, Good, etc.
    },
    remark: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: false }
);

const gradeRuleSchema = new mongoose.Schema(
  {
    ruleName: {
      type: String,
      required: [true, 'Grade rule name is required (e.g. MP Board 8-Point Scale)'],
      trim: true
    },
    ruleCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    scaleType: {
      type: String,
      enum: ['8_POINT', '9_POINT', '5_POINT', 'DIVISION_SYSTEM', 'CUSTOM'],
      default: '8_POINT'
    },
    boundaries: [gradeBoundarySchema],
    version: {
      type: Number,
      default: 1
    },
    isDefault: {
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

module.exports = mongoose.model('GradeRule', gradeRuleSchema);
