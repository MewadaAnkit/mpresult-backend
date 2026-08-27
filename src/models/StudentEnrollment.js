const mongoose = require('mongoose');

const studentEnrollmentSchema = new mongoose.Schema(
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
    rollNo: {
      type: String,
      required: true,
      trim: true
    },
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stream',
      default: null
    },
    streamName: {
      type: String,
      default: ''
    },
    subjectCombinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubjectCombination',
      default: null
    },
    enrolledSubjects: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject'
        },
        subjectName: String,
        subjectCode: String,
        subjectType: {
          type: String,
          enum: ['COMPULSORY', 'OPTIONAL', 'ELECTIVE', 'ADDITIONAL', 'VOCATIONAL'],
          default: 'COMPULSORY'
        }
      }
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'PROMOTED', 'DETAINED', 'PASSED_OUT', 'TRANSFERRED', 'WITHDRAWN'],
      default: 'ACTIVE'
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

studentEnrollmentSchema.index({ studentId: 1, sessionName: 1 }, { unique: true });
studentEnrollmentSchema.index({ sessionName: 1, className: 1, sectionName: 1, rollNo: 1 });

module.exports = mongoose.model('StudentEnrollment', studentEnrollmentSchema);
