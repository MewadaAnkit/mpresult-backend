const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    admissionNo: {
      type: String,
      required: [true, 'Admission number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    samagraId: {
      type: String,
      trim: true,
      default: '' // MP Samagra ID (9 digits)
    },
    mpBseRollNo: {
      type: String,
      trim: true,
      default: '' // State / Board Candidate Identifier for Cls 5, 8, 10, 12
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
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
    guardianName: {
      type: String,
      trim: true,
      default: ''
    },
    dob: {
      type: Date,
      default: null
    },
    dobWords: {
      type: String,
      trim: true,
      default: ''
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      default: 'MALE'
    },
    category: {
      type: String,
      enum: ['GEN', 'OBC', 'SC', 'ST', 'EWS', 'OTHER'],
      default: 'GEN'
    },
    mobileNo: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    admissionDate: {
      type: Date,
      default: Date.now
    },
    // Current Placement Pointer for fast querying
    currentSession: {
      type: String,
      required: true,
      trim: true
    },
    currentClass: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    currentSection: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    currentRollNo: {
      type: String,
      required: true,
      trim: true
    },
    currentStream: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
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

studentSchema.index({ currentClass: 1, currentSection: 1 });
studentSchema.index({ samagraId: 1 });
studentSchema.index({ mpBseRollNo: 1 });

module.exports = mongoose.model('Student', studentSchema);
