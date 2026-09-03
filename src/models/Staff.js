const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    fullName: {
      type: String,
      required: [true, 'Staff name is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      default: 'MALE'
    },
    designation: {
      type: String,
      required: true,
      trim: true
    },
    cadre: {
      type: String,
      enum: ['PRT', 'TGT', 'PGT', 'SPECIALIST', 'OTHER'],
      default: 'TGT'
    },
    teachingWings: [
      {
        type: String,
        enum: ['PRIMARY', 'MIDDLE', 'SECONDARY', 'SENIOR_SECONDARY', 'ALL']
      }
    ],
    primarySubject: {
      type: String,
      trim: true,
      default: ''
    },
    department: {
      type: String,
      enum: ['ACADEMIC', 'ADMINISTRATION', 'ACCOUNTS', 'LIBRARY', 'TRANSPORT', 'SPORTS', 'SUPPORT'],
      default: 'ACADEMIC'
    },
    qualification: {
      type: String,
      trim: true,
      default: ''
    },
    experienceYears: {
      type: Number,
      default: 0
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    salary: {
      type: Number,
      default: 0
    },
    address: {
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

staffSchema.index({ designation: 1, department: 1 });

module.exports = mongoose.model('Staff', staffSchema);
