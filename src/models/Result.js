const mongoose = require('mongoose');
const crypto = require('crypto');
const { RESULT_STATUSES, APPROVAL_STAGES } = require('../constants/resultStatuses');

const subjectResultSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    subjectName: {
      type: String,
      required: true
    },
    subjectCode: {
      type: String,
      required: true
    },
    subjectType: {
      type: String,
      default: 'COMPULSORY'
    },
    components: [
      {
        componentCode: String,
        componentName: String,
        maxMarks: Number,
        obtainedMarks: Number,
        attendanceStatus: String,
        isGraceGiven: Boolean,
        graceMarks: Number
      }
    ],
    totalMaxMarks: {
      type: Number,
      required: true
    },
    totalObtainedMarks: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    grade: {
      type: String,
      default: ''
    },
    gradePoint: {
      type: Number,
      default: 0
    },
    isPassed: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      default: 'PASS'
    }
  },
  { _id: false }
);

const coScholasticSchema = new mongoose.Schema(
  {
    workEducation: { type: String, default: 'A' },
    artEducation: { type: String, default: 'A' },
    healthAndPhysicalEducation: { type: String, default: 'A' },
    discipline: { type: String, default: 'A' },
    generalConduct: { type: String, default: 'GOOD' }
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
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
    rollNo: {
      type: String,
      required: true,
      trim: true
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
    streamName: {
      type: String,
      trim: true,
      default: ''
    },
    schemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExaminationScheme',
      required: true
    },
    schemeVersion: {
      type: Number,
      default: 1
    },
    gradeRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GradeRule'
    },
    passingRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PassingRule'
    },
    subjectResults: [subjectResultSchema],
    grandTotalMax: {
      type: Number,
      default: 0
    },
    grandTotalObtained: {
      type: Number,
      default: 0
    },
    overallPercentage: {
      type: Number,
      default: 0
    },
    overallGrade: {
      type: String,
      default: ''
    },
    division: {
      type: String,
      default: '' // First Division, Second Division, Third Division
    },
    resultStatus: {
      type: String,
      enum: Object.values(RESULT_STATUSES),
      default: RESULT_STATUSES.PENDING
    },
    failedSubjectCount: {
      type: Number,
      default: 0
    },
    failedSubjects: [String],
    graceMarksGiven: {
      type: Number,
      default: 0
    },
    attendance: {
      totalWorkingDays: { type: Number, default: 220 },
      attendedDays: { type: Number, default: 200 },
      attendancePercentage: { type: Number, default: 90.9 }
    },
    coScholastic: {
      type: coScholasticSchema,
      default: () => ({})
    },
    teacherRemarks: {
      type: String,
      trim: true,
      default: 'VERY GOOD PERFORMANCE'
    },
    approvalStage: {
      type: String,
      enum: Object.values(APPROVAL_STAGES),
      default: APPROVAL_STAGES.DRAFT
    },
    verificationCode: {
      type: String,
      unique: true,
      index: true
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    publishedAt: {
      type: Date,
      default: null
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    reopenHistory: [
      {
        reopenedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reopenedAt: { type: Date, default: Date.now },
        reason: String,
        previousStage: String
      }
    ]
  },
  {
    timestamps: true
  }
);

resultSchema.index({ studentId: 1, examinationId: 1 }, { unique: true });
resultSchema.index({ sessionName: 1, className: 1, sectionName: 1, examinationId: 1 });

// Generate unique verification code before saving
resultSchema.pre('save', function (next) {
  if (!this.verificationCode) {
    const hash = crypto.randomBytes(8).toString('hex').toUpperCase();
    this.verificationCode = `MPRMS-${this.sessionName ? this.sessionName.replace('-', '') : '2026'}-${this.className}-${hash}`;
  }
  next();
});

module.exports = mongoose.model('Result', resultSchema);
