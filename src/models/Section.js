const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
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
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stream',
      default: null
    },
    roomNumber: {
      type: String,
      trim: true,
      default: ''
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    classTeacherName: {
      type: String,
      trim: true,
      default: ''
    },
    maxCapacity: {
      type: Number,
      default: 50
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

sectionSchema.index({ className: 1, sectionName: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);
