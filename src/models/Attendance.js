const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    admissionNo: {
      type: String,
      required: true,
      trim: true
    },
    rollNo: {
      type: String,
      required: true,
      trim: true
    },
    studentName: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE', 'HOLIDAY'],
      default: 'PRESENT'
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    academicSession: {
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
    date: {
      type: Date,
      required: true
    },
    totalStudents: {
      type: Number,
      default: 0
    },
    presentCount: {
      type: Number,
      default: 0
    },
    absentCount: {
      type: Number,
      default: 0
    },
    lateCount: {
      type: Number,
      default: 0
    },
    records: [attendanceRecordSchema],
    takenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    takenByName: {
      type: String,
      default: ''
    },
    isLocked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

attendanceSchema.index({ academicSession: 1, className: 1, sectionName: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
