const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'attendance_marked',
      'attendance_reminder',
      'low_attendance_warning',
      'fraud_alert',
      'system_alert',
      'class_cancelled',
      'class_rescheduled',
      'parent_notification',
      'faculty_notification'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  metadata: {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' },
    actionRequired: { type: Boolean, default: false },
    actionType: String,
    actionUrl: String,
    expiresAt: Date
  },
  deliveryStatus: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ 'metadata.classId': 1 });
notificationSchema.index({ 'metadata.sessionId': 1 });

// Virtual for age of notification
notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.status = 'read';
  await this.save();
};

// Method to archive notification
notificationSchema.methods.archive = async function() {
  this.status = 'archived';
  await this.save();
};

// Method to update delivery status
notificationSchema.methods.updateDeliveryStatus = async function(channel, status, error = null) {
  this.deliveryStatus[channel] = {
    sent: status,
    sentAt: status ? new Date() : null,
    error: error
  };
  await this.save();
};

// Static method to get unread notifications
notificationSchema.statics.getUnread = function(userId) {
  return this.find({
    userId,
    status: 'unread'
  }).sort({ createdAt: -1 });
};

// Static method to get notifications by type
notificationSchema.statics.getByType = function(userId, type) {
  return this.find({
    userId,
    type
  }).sort({ createdAt: -1 });
};

// Static method to get notification statistics
notificationSchema.statics.getStatistics = async function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Notification', notificationSchema);