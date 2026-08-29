const mongoose = require('mongoose');

const admissionInquirySchema = new mongoose.Schema(
  {
    inquiryNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    academicSession: {
      type: String,
      required: true,
      trim: true
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      default: 'MALE'
    },
    dob: {
      type: Date,
      default: null
    },
    appliedClass: {
      type: String,
      required: [true, 'Applied class is required'],
      trim: true,
      uppercase: true
    },
    previousSchool: {
      type: String,
      trim: true,
      default: ''
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
    guardianPhone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true
    },
    guardianEmail: {
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
    status: {
      type: String,
      enum: [
        'NEW',
        'CONTACTED',
        'APPLICATION_STARTED',
        'SUBMITTED',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'ADMITTED'
      ],
      default: 'NEW'
    },
    assignedCounselor: {
      type: String,
      trim: true,
      default: ''
    },
    followUpDate: {
      type: Date,
      default: null
    },
    notes: [
      {
        text: String,
        addedBy: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    admittedStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null
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

admissionInquirySchema.index({ academicSession: 1, appliedClass: 1 });
admissionInquirySchema.index({ status: 1 });
admissionInquirySchema.index({ guardianPhone: 1 });

module.exports = mongoose.model('AdmissionInquiry', admissionInquirySchema);
