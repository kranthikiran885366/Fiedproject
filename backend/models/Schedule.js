const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  room: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrolledStudents: {
    type: Number,
    default: 0
  },
  recurring: {
    type: Boolean,
    default: false
  },
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient querying
scheduleSchema.index({ startTime: 1, endTime: 1 });
scheduleSchema.index({ faculty: 1, startTime: 1 });

// Virtual for duration
scheduleSchema.virtual('duration').get(function() {
  return this.endTime - this.startTime;
});

// Method to check if class is in progress
scheduleSchema.methods.isInProgress = function() {
  const now = new Date();
  return now >= this.startTime && now <= this.endTime;
};

// Method to check if class is upcoming
scheduleSchema.methods.isUpcoming = function() {
  const now = new Date();
  return now < this.startTime;
};

// Method to check if class is completed
scheduleSchema.methods.isCompleted = function() {
  const now = new Date();
  return now > this.endTime;
};

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule; 