const mongoose = require('mongoose');

const examScheduleSchema = new mongoose.Schema(
  {
    examination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true
    },
    examinationName: {
      type: String,
      required: true,
      trim: true
    },
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
      trim: true,
      uppercase: true,
      default: 'ALL'
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    subjectName: {
      type: String,
      required: true,
      trim: true
    },
    subjectCode: {
      type: String,
      trim: true,
      default: ''
    },
    examDate: {
      type: Date,
      required: true
    },
    dayOfWeek: {
      type: String,
      trim: true
    },
    startTime: {
      type: String,
      required: true,
      trim: true
    },
    endTime: {
      type: String,
      required: true,
      trim: true
    },
    durationMinutes: {
      type: Number,
      default: 180
    },
    examType: {
      type: String,
      enum: ['THEORY', 'PRACTICAL', 'INTERNAL_ASSESSMENT', 'VIVA', 'PROJECT', 'UNIT_TEST'],
      default: 'THEORY'
    },
    roomOrHall: {
      type: String,
      trim: true,
      default: 'Main Examination Hall'
    },
    invigilatorName: {
      type: String,
      trim: true,
      default: ''
    },
    instructions: {
      type: String,
      trim: true,
      default: 'Students must report 30 minutes before exam. Bring Admit Card and School ID.'
    },
    maxMarks: {
      type: Number,
      default: 100
    },
    minPassingMarks: {
      type: Number,
      default: 33
    },
    status: {
      type: String,
      enum: ['DRAFT', 'REVIEWED', 'PUBLISHED', 'COMPLETED'],
      default: 'DRAFT'
    },
    allowMarksEntryAfterExam: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    publishedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to calculate dayOfWeek if not provided
examScheduleSchema.pre('save', function (next) {
  if (this.examDate) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(this.examDate);
    this.dayOfWeek = days[d.getDay()];
  }
  next();
});

examScheduleSchema.index({ academicSession: 1, examination: 1, className: 1, sectionName: 1, examDate: 1 });
examScheduleSchema.index({ academicSession: 1, className: 1, examDate: 1 });
examScheduleSchema.index({ status: 1 });

module.exports = mongoose.model('ExamSchedule', examScheduleSchema);
