const mongoose = require('mongoose');
const { ATTENDANCE_STATUSES } = require('../constants/examinationTypes');

const componentMarkSchema = new mongoose.Schema(
  {
    componentCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true // TH, PR, IA, etc.
    },
    componentName: {
      type: String,
      required: true,
      trim: true
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 0
    },
    obtainedMarks: {
      type: Number,
      default: 0,
      min: 0
    },
    attendanceStatus: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUSES),
      default: ATTENDANCE_STATUSES.PRESENT
    },
    isGraceGiven: {
      type: Boolean,
      default: false
    },
    graceMarks: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const marksSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    admissionNo: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    examinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true
    },
    sessionName: {
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
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    subjectName: {
      type: String,
      required: true,
      trim: true
    },
    subjectCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    components: [componentMarkSchema],
    totalMaxMarks: {
      type: Number,
      required: true,
      default: 100
    },
    totalObtainedMarks: {
      type: Number,
      required: true,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    grade: {
      type: String,
      default: ''
    },
    isPassed: {
      type: Boolean,
      default: false // BUG-020 FIX: Default false — only true when marks are explicitly entered and validated
    },
    // BUG-020 FIX: Track absent/expelled students
    status: {
      type: String,
      enum: ['PRESENT', 'ABS', 'EXP'],
      default: 'PRESENT',
      uppercase: true
    },
    isLocked: {
      type: Boolean,
      default: false
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

marksSchema.index({ studentId: 1, examinationId: 1, subjectId: 1 }, { unique: true });
marksSchema.index({ examinationId: 1, className: 1, sectionName: 1, subjectId: 1 });

module.exports = mongoose.model('Marks', marksSchema);
