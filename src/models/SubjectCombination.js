const mongoose = require('mongoose');

const subjectCombinationSchema = new mongoose.Schema(
  {
    combinationName: {
      type: String,
      required: [true, 'Combination name is required (e.g. PCM + CS)'],
      trim: true
    },
    combinationCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    className: {
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
    streamName: {
      type: String,
      default: ''
    },
    compulsorySubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      }
    ],
    electiveSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      }
    ],
    additionalSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      }
    ],
    description: {
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

subjectCombinationSchema.index({ className: 1, combinationCode: 1 }, { unique: true });

module.exports = mongoose.model('SubjectCombination', subjectCombinationSchema);
