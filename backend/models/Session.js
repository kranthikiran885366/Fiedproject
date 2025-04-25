const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['regular', 'extra', 'makeup'],
    default: 'regular'
  },
  verificationMethods: [{
    type: String,
    enum: ['face', 'cctv', 'manual'],
    required: true
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    radius: { type: Number, default: 100 }, // Geofence radius in meters
    building: { type: String },
    room: { type: String }
  },
  settings: {
    allowLateEntry: { type: Boolean, default: true },
    lateEntryThreshold: { type: Number, default: 15 }, // minutes
    requireLocation: { type: Boolean, default: true },
    requireFaceVerification: { type: Boolean, default: true },
    minimumAttendanceDuration: { type: Number, default: 45 }, // minutes
    autoMarkAbsent: { type: Boolean, default: true }
  },
  cctvStreams: [{
    streamUrl: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'error'],
      default: 'inactive'
    },
    location: {
      building: String,
      room: String,
      position: String
    }
  }],
  metadata: {
    subject: String,
    topic: String,
    notes: String,
    academicYear: String,
    semester: String
  },
  statistics: {
    totalStudents: { type: Number, default: 0 },
    presentCount: { type: Number, default: 0 },
    absentCount: { type: Number, default: 0 },
    lateCount: { type: Number, default: 0 },
    averageAttendanceDuration: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
sessionSchema.index({ classId: 1, startTime: -1 });
sessionSchema.index({ facultyId: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ location: '2dsphere' });

// Virtual for session duration
sessionSchema.virtual('duration').get(function() {
  if (this.startTime && this.endTime) {
    return (this.endTime - this.startTime) / (1000 * 60); // Duration in minutes
  }
  return 0;
});

// Virtual for attendance percentage
sessionSchema.virtual('attendancePercentage').get(function() {
  if (this.statistics.totalStudents > 0) {
    return (this.statistics.presentCount / this.statistics.totalStudents) * 100;
  }
  return 0;
});

// Method to start session
sessionSchema.methods.startSession = async function() {
  this.status = 'active';
  this.startTime = new Date();
  await this.save();
};

// Method to end session
sessionSchema.methods.endSession = async function() {
  this.status = 'completed';
  this.endTime = new Date();
  await this.save();
};

// Method to update statistics
sessionSchema.methods.updateStatistics = async function(stats) {
  Object.assign(this.statistics, stats);
  await this.save();
};

// Static method to get active sessions
sessionSchema.statics.getActiveSessions = function() {
  return this.find({ status: 'active' })
    .populate('classId')
    .populate('facultyId');
};

// Static method to get session analytics
sessionSchema.statics.getAnalytics = async function(filters) {
  return this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: '$classId',
        totalSessions: { $sum: 1 },
        averageAttendance: { $avg: '$statistics.attendancePercentage' },
        totalDuration: { $sum: '$duration' }
      }
    }
  ]);
};

module.exports = mongoose.model('Session', sessionSchema);
