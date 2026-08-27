const mongoose = require('mongoose');

const componentPassingRuleSchema = new mongoose.Schema(
  {
    componentCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true // TH, PR, IA
    },
    minPercentage: {
      type: Number,
      required: true,
      default: 33
    },
    isRequiredToPass: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const passingRuleSchema = new mongoose.Schema(
  {
    ruleName: {
      type: String,
      required: [true, 'Passing rule name is required'],
      trim: true
    },
    ruleCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    overallMinPercentage: {
      type: Number,
      required: true,
      default: 33
    },
    subjectMinPercentage: {
      type: Number,
      required: true,
      default: 33
    },
    requireComponentPassing: {
      type: Boolean,
      default: false // If true, must pass theory and practical separately
    },
    componentRules: [componentPassingRuleSchema],
    graceMarksPolicy: {
      allowGraceMarks: {
        type: Boolean,
        default: false
      },
      maxGraceMarksPerSubject: {
        type: Number,
        default: 0
      },
      maxGraceMarksTotal: {
        type: Number,
        default: 0
      }
    },
    supplementaryRules: {
      allowSupplementary: {
        type: Boolean,
        default: true
      },
      maxFailedSubjects: {
        type: Number,
        default: 2
      }
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    version: {
      type: Number,
      default: 1
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

module.exports = mongoose.model('PassingRule', passingRuleSchema);
