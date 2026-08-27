const mongoose = require('mongoose');
const { COMPONENT_TYPES } = require('../constants/examinationTypes');

const subjectComponentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true // TH, PR, IA, PROJ, ORAL
    },
    type: {
      type: String,
      enum: Object.values(COMPONENT_TYPES),
      default: COMPONENT_TYPES.THEORY
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1
    },
    passingMarks: {
      type: Number,
      default: 0
    },
    weightage: {
      type: Number,
      default: 100 // Percentage weightage or direct
    },
    order: {
      type: Number,
      default: 1
    }
  },
  { _id: false }
);

const subjectSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true
    },
    subjectCode: {
      type: String,
      required: [true, 'Subject code is required'],
      trim: true,
      uppercase: true
    },
    applicableClasses: [
      {
        type: String,
        trim: true,
        uppercase: true
      }
    ],
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stream',
      default: null
    },
    streamName: {
      type: String,
      default: ''
    },
    subjectType: {
      type: String,
      enum: ['COMPULSORY', 'OPTIONAL', 'ELECTIVE', 'ADDITIONAL', 'VOCATIONAL'],
      default: 'COMPULSORY'
    },
    hasTheory: {
      type: Boolean,
      default: true
    },
    hasPractical: {
      type: Boolean,
      default: false
    },
    hasProject: {
      type: Boolean,
      default: false
    },
    hasInternalAssessment: {
      type: Boolean,
      default: false
    },
    totalMaxMarks: {
      type: Number,
      required: true,
      default: 100
    },
    totalPassingMarks: {
      type: Number,
      default: 33
    },
    components: [subjectComponentSchema],
    displayOrder: {
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

subjectSchema.index({ subjectCode: 1 });
subjectSchema.index({ applicableClasses: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
