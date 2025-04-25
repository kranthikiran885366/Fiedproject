const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'late', 'absent', 'excused'],
    required: true
  },
  markedBy: {
    type: String,
    enum: ['system', 'faculty', 'student'],
    required: true
  },
  verificationMethod: {
    type: String,
    enum: ['face_recognition', 'manual', 'qr_code', 'biometric'],
    required: true
  },
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    address: String
  },
  deviceInfo: {
    userAgent: String,
    ip: String,
    deviceId: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
attendanceSchema.index({ student: 1, date: 1 });
attendanceSchema.index({ class: 1, date: 1 });
attendanceSchema.index({ status: 1, date: 1 });

// Static method to get attendance statistics
attendanceSchema.statics.getStatistics = async function(filters) {
  const stats = await this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  return stats.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});
};

// Static method to get attendance trends
attendanceSchema.statics.getTrends = async function(studentId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        student: mongoose.Types.ObjectId(studentId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        present: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        },
        late: {
          $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
        },
        absent: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Method to check if attendance is valid
attendanceSchema.methods.isValid = function() {
  const now = new Date();
  const attendanceDate = new Date(this.date);
  return Math.abs(now - attendanceDate) <= 24 * 60 * 60 * 1000; // Within 24 hours
};

// Method to get attendance details
attendanceSchema.methods.getDetails = function() {
  return {
    id: this._id,
    student: this.student,
    class: this.class,
    date: this.date,
    status: this.status,
    markedBy: this.markedBy,
    verificationMethod: this.verificationMethod,
    location: this.location,
    deviceInfo: this.deviceInfo,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;