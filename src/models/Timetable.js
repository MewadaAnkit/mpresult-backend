const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema(
  {
    periodNumber: {
      type: Number,
      required: true
    },
    startTime: {
      type: String,
      required: true,
      trim: true // e.g. "08:30"
    },
    endTime: {
      type: String,
      required: true,
      trim: true // e.g. "09:15"
    },
    subjectCode: {
      type: String,
      trim: true,
      default: ''
    },
    subjectName: {
      type: String,
      trim: true,
      default: ''
    },
    teacherName: {
      type: String,
      trim: true,
      default: ''
    },
    roomNo: {
      type: String,
      trim: true,
      default: ''
    },
    isBreak: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const timetableSchema = new mongoose.Schema(
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
    dayOfWeek: {
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      required: true
    },
    periods: [periodSchema]
  },
  {
    timestamps: true
  }
);

timetableSchema.index({ academicSession: 1, className: 1, sectionName: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
