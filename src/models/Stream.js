const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema(
  {
    streamName: {
      type: String,
      required: [true, 'Stream name is required (e.g. Science, Commerce, Arts)'],
      unique: true,
      trim: true
    },
    streamCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
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

module.exports = mongoose.model('Stream', streamSchema);
