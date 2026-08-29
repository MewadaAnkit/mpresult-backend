const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true
    },
    audience: {
      type: String,
      enum: ['ALL', 'TEACHERS', 'PARENTS', 'STUDENTS', 'CLASS_SPECIFIC'],
      default: 'ALL'
    },
    targetClasses: [
      {
        type: String,
        trim: true,
        uppercase: true
      }
    ],
    priority: {
      type: String,
      enum: ['NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL'
    },
    academicSession: {
      type: String,
      required: true,
      trim: true
    },
    publishDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      default: null
    },
    authorName: {
      type: String,
      default: 'Principal Office'
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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

announcementSchema.index({ academicSession: 1, publishDate: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
