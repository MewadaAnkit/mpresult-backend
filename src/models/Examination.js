const mongoose = require('mongoose');
const { EXAMINATION_TYPES } = require('../constants/examinationTypes');

const examinationSchema = new mongoose.Schema(
  {
    examName: {
      type: String,
      required: [true, 'Exam name is required (e.g. Annual Examination 2025-26)'],
      trim: true
    },
    examCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    sessionName: {
      type: String,
      required: true,
      trim: true
    },
    examType: {
      type: String,
      enum: Object.values(EXAMINATION_TYPES),
      default: EXAMINATION_TYPES.SUMMATIVE
    },
    schemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExaminationScheme',
      required: true
    },
    applicableClasses: [
      {
        type: String,
        required: true,
        trim: true,
        uppercase: true
      }
    ],
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    marksSubmissionDeadline: {
      type: Date
    },
    isMarksEntryLocked: {
      type: Boolean,
      default: false
    },
    isResultPublished: {
      type: Boolean,
      default: false
    },
    publishedDate: {
      type: Date,
      default: null
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

examinationSchema.index({ sessionName: 1, examCode: 1 }, { unique: true });
examinationSchema.index({ applicableClasses: 1, sessionName: 1 });

module.exports = mongoose.model('Examination', examinationSchema);
