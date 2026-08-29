const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema(
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
    subjectName: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Homework title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Instructions/description required'],
      trim: true
    },
    assignedDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String
      }
    ],
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedByName: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

homeworkSchema.index({ academicSession: 1, className: 1, sectionName: 1, dueDate: -1 });

module.exports = mongoose.model('Homework', homeworkSchema);
