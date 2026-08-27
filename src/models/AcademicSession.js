const mongoose = require('mongoose');

const academicSessionSchema = new mongoose.Schema(
  {
    sessionName: {
      type: String,
      required: [true, 'Session name is required (e.g. 2025-26)'],
      unique: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    isCurrent: {
      type: Boolean,
      default: false
    },
    isLocked: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// If isCurrent is set to true, unset isCurrent on all other sessions
academicSessionSchema.pre('save', async function (next) {
  if (this.isCurrent) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isCurrent: false } }
    );
  }
  next();
});

module.exports = mongoose.model('AcademicSession', academicSessionSchema);
