const mongoose = require('mongoose');

const teacherAllocationSchema = new mongoose.Schema(
  {
    academicSession: {
      type: String,
      required: true,
      trim: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true
    },
    teacherName: {
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
    subjectCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    subjectName: {
      type: String,
      required: true,
      trim: true
    },
    isClassTeacher: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

teacherAllocationSchema.index({ academicSession: 1, className: 1, sectionName: 1, subjectCode: 1 }, { unique: true });
teacherAllocationSchema.index({ teacher: 1, academicSession: 1 });

module.exports = mongoose.model('TeacherAllocation', teacherAllocationSchema);
