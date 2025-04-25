const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true },
  academicYear: { type: String, required: true },
  faculty: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['primary', 'secondary', 'substitute'],
      default: 'primary'
    },
    assignedDate: { type: Date, default: Date.now }
  }],
  students: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    enrollmentDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'inactive', 'transferred'],
      default: 'active'
    }
  }],
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: String,
    endTime: String,
    room: String,
    building: String
  }],
  settings: {
    attendanceThreshold: { type: Number, default: 75 }, // Minimum attendance percentage required
    allowProxyAttendance: { type: Boolean, default: false },
    autoMarkAbsent: { type: Boolean, default: true },
    notifyParents: { type: Boolean, default: true },
    notifyFaculty: { type: Boolean, default: true },
    blockchainEnabled: { type: Boolean, default: true },
    faceRecognitionRequired: { type: Boolean, default: true },
    geofencingRequired: { type: Boolean, default: true }
  },
  analytics: {
    totalSessions: { type: Number, default: 0 },
    averageAttendance: { type: Number, default: 0 },
    lastUpdated: { type: Date }
  },
  metadata: {
    syllabus: String,
    description: String,
    credits: Number,
    courseType: {
      type: String,
      enum: ['core', 'elective', 'lab'],
      default: 'core'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
classSchema.index({ code: 1 }, { unique: true });
classSchema.index({ department: 1, semester: 1 });
classSchema.index({ 'faculty.userId': 1 });
classSchema.index({ 'students.userId': 1 });

// Virtual for total students
classSchema.virtual('totalStudents').get(function() {
  return this.students.filter(student => student.status === 'active').length;
});

// Virtual for primary faculty
classSchema.virtual('primaryFaculty').get(function() {
  const primary = this.faculty.find(f => f.role === 'primary');
  return primary ? primary.userId : null;
});

// Method to add student
classSchema.methods.addStudent = async function(studentId) {
  if (!this.students.some(s => s.userId.equals(studentId))) {
    this.students.push({
      userId: studentId,
      enrollmentDate: new Date(),
      status: 'active'
    });
    await this.save();
  }
};

// Method to remove student
classSchema.methods.removeStudent = async function(studentId) {
  const studentIndex = this.students.findIndex(s => s.userId.equals(studentId));
  if (studentIndex !== -1) {
    this.students[studentIndex].status = 'inactive';
    await this.save();
  }
};

// Method to update analytics
classSchema.methods.updateAnalytics = async function(stats) {
  this.analytics = {
    ...this.analytics,
    ...stats,
    lastUpdated: new Date()
  };
  await this.save();
};

// Static method to get class analytics
classSchema.statics.getAnalytics = async function(filters) {
  return this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: '$department',
        totalClasses: { $sum: 1 },
        averageAttendance: { $avg: '$analytics.averageAttendance' }
      }
    }
  ]);
};

// Static method to get classes by faculty
classSchema.statics.getByFaculty = function(facultyId) {
  return this.find({
    'faculty.userId': facultyId
  }).populate('students.userId');
};

module.exports = mongoose.model('Class', classSchema);
