const mongoose = require('mongoose');
const { EXAMINATION_TYPES, COMPONENT_TYPES } = require('../constants/examinationTypes');

const schemeComponentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true // e.g. Theory, Practical, Project, Internal Assessment, Periodic
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true // TH, PR, PROJ, IA, PT, ORAL
    },
    type: {
      type: String,
      enum: Object.values(COMPONENT_TYPES),
      default: COMPONENT_TYPES.THEORY
    },
    defaultMaxMarks: {
      type: Number,
      required: true,
      default: 80
    },
    passingMarks: {
      type: Number,
      default: 0
    },
    weightagePercentage: {
      type: Number,
      default: 100 // Contribution to subject aggregate
    },
    required: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 1
    }
  },
  { _id: false }
);

const examinationSchemeSchema = new mongoose.Schema(
  {
    schemeName: {
      type: String,
      required: [true, 'Scheme name is required (e.g. MP Class 9 Annual Exam Pattern)'],
      trim: true
    },
    schemeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    applicableClasses: [
      {
        type: String,
        required: true,
        trim: true,
        uppercase: true
      }
    ],
    applicableStreams: [
      {
        type: String,
        trim: true,
        uppercase: true
      }
    ],
    examType: {
      type: String,
      enum: Object.values(EXAMINATION_TYPES),
      default: EXAMINATION_TYPES.SUMMATIVE
    },
    components: [schemeComponentSchema],
    totalMaxMarks: {
      type: Number,
      required: true,
      default: 100
    },
    allowSubjectComponentOverride: {
      type: Boolean,
      default: true // Allows a subject (e.g. Physics 70/30 vs Hindi 80/20) to define its own component max marks
    },
    passingRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PassingRule',
      required: true
    },
    gradeRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GradeRule',
      required: true
    },
    calculationMethod: {
      type: String,
      enum: ['SUM_COMPONENTS', 'WEIGHTED_PERCENTAGE', 'BEST_N_SCORES'],
      default: 'SUM_COMPONENTS'
    },
    version: {
      type: Number,
      default: 1
    },
    description: {
      type: String,
      trim: true,
      default: ''
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

examinationSchemeSchema.index({ applicableClasses: 1 });

module.exports = mongoose.model('ExaminationScheme', examinationSchemeSchema);
