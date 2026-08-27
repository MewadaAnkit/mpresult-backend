const mongoose = require('mongoose');
const { RESULT_STATUSES } = require('../constants/resultStatuses');

const externalSubjectScoreSchema = new mongoose.Schema(
  {
    subjectCode: { type: String, required: true },
    subjectName: { type: String, required: true },
    theoryMaxMarks: { type: Number, default: 0 },
    theoryObtainedMarks: { type: Number, default: 0 },
    practicalMaxMarks: { type: Number, default: 0 },
    practicalObtainedMarks: { type: Number, default: 0 },
    projectMaxMarks: { type: Number, default: 0 },
    projectObtainedMarks: { type: Number, default: 0 },
    totalMaxMarks: { type: Number, required: true },
    totalObtainedMarks: { type: Number, required: true },
    grade: { type: String, default: '' },
    isPassed: { type: Boolean, default: true }
  },
  { _id: false }
);

const externalResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null
    },
    admissionNo: {
      type: String,
      trim: true,
      uppercase: true
    },
    studentName: {
      type: String,
      required: true,
      trim: true
    },
    fatherName: {
      type: String,
      trim: true,
      default: ''
    },
    motherName: {
      type: String,
      trim: true,
      default: ''
    },
    dob: Date,
    sessionName: {
      type: String,
      required: true,
      trim: true
    },
    className: {
      type: String,
      required: true,
      trim: true,
      uppercase: true // "5", "8", "10", "12"
    },
    streamName: {
      type: String,
      trim: true,
      default: ''
    },
    boardRollNo: {
      type: String,
      required: true,
      trim: true
    },
    applicationNo: {
      type: String,
      trim: true,
      default: ''
    },
    centerCode: {
      type: String,
      trim: true,
      default: ''
    },
    schoolCode: {
      type: String,
      trim: true,
      default: ''
    },
    authorityName: {
      type: String,
      required: true,
      default: 'MP Board of Secondary Education (MPBSE) / Rajya Shiksha Kendra'
    },
    subjectScores: [externalSubjectScoreSchema],
    grandTotalMax: {
      type: Number,
      required: true
    },
    grandTotalObtained: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    division: {
      type: String,
      default: ''
    },
    overallGrade: {
      type: String,
      default: ''
    },
    resultStatus: {
      type: String,
      enum: Object.values(RESULT_STATUSES),
      default: RESULT_STATUSES.PASS
    },
    resultDeclaredDate: {
      type: Date
    },
    importSource: {
      type: String,
      enum: ['MANUAL_ENTRY', 'EXCEL_IMPORT', 'CSV_IMPORT', 'API_SYNC'],
      default: 'MANUAL_ENTRY'
    },
    verificationStatus: {
      type: String,
      enum: ['VERIFIED_WITH_GAZETTE', 'PROVISIONAL', 'PENDING_VERIFICATION'],
      default: 'VERIFIED_WITH_GAZETTE'
    },
    officialRemarks: {
      type: String,
      default: 'Official External Board / Authority Declared Record'
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

externalResultSchema.index({ boardRollNo: 1, sessionName: 1, className: 1 }, { unique: true });
externalResultSchema.index({ admissionNo: 1 });

module.exports = mongoose.model('ExternalResult', externalResultSchema);
