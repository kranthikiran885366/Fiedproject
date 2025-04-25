const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Session = require('../models/Session');
const FacialData = require('../models/FacialData');
const Location = require('../models/Location');
const BlockchainService = require('./blockchainService');
const NotificationService = require('./notificationService');

class AttendanceService {
  constructor() {
    this.attendanceWindow = 15 * 60 * 1000; // 15 minutes grace period
  }

  async markAttendance(studentId, classId, timestamp, status) {
    try {
      // Check if attendance is already marked
      const existingAttendance = await Attendance.findOne({
        student: studentId,
        class: classId,
        date: {
          $gte: new Date(timestamp).setHours(0, 0, 0, 0),
          $lt: new Date(timestamp).setHours(23, 59, 59, 999)
        }
      });

      if (existingAttendance) {
        return { success: false, message: 'Attendance already marked' };
      }

      const attendance = new Attendance({
        student: studentId,
        class: classId,
        date: timestamp,
        status,
        markedBy: 'system',
        verificationMethod: 'face_recognition'
      });

      await attendance.save();
      return { success: true, attendance };
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  }

  async getAttendanceStats(classId, date) {
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const classSchedule = await Schedule.findById(classId);
      const enrolledStudents = await User.countDocuments({
        role: 'student',
        enrolledClasses: classId
      });

      const attendance = await Attendance.find({
        class: classId,
        date: { $gte: startDate, $lte: endDate }
      });

      const stats = {
        totalStudents: enrolledStudents,
        present: attendance.filter(a => a.status === 'present').length,
        late: attendance.filter(a => a.status === 'late').length,
        absent: enrolledStudents - attendance.length
      };

      return stats;
    } catch (error) {
      console.error('Error getting attendance stats:', error);
      throw error;
    }
  }

  async getStudentAttendance(studentId, startDate, endDate) {
    try {
      const attendance = await Attendance.find({
        student: studentId,
        date: { $gte: startDate, $lte: endDate }
      }).populate('class', 'subject room startTime endTime');

      return attendance;
    } catch (error) {
      console.error('Error getting student attendance:', error);
      throw error;
    }
  }

  async getClassAttendance(classId, date) {
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const attendance = await Attendance.find({
        class: classId,
        date: { $gte: startDate, $lte: endDate }
      }).populate('student', 'name enrollmentNumber');

      return attendance;
    } catch (error) {
      console.error('Error getting class attendance:', error);
      throw error;
    }
  }

  async generateAttendanceReport(classId, startDate, endDate) {
    try {
      const attendance = await Attendance.find({
        class: classId,
        date: { $gte: startDate, $lte: endDate }
      }).populate('student', 'fullName regNumber');

      const students = await User.find({ 
        role: 'student',
        enrolledClasses: classId 
      });
      
      const report = {
        class: classId,
        period: { startDate, endDate },
        totalClasses: Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000)),
        students: students.map(student => {
          const studentAttendance = attendance.filter(a => 
            a.student._id.toString() === student._id.toString()
          );
          return {
            studentId: student._id,
            name: student.fullName,
            enrollmentNumber: student.regNumber,
            totalPresent: studentAttendance.filter(a => a.status === 'present').length,
            totalLate: studentAttendance.filter(a => a.status === 'late').length,
            totalAbsent: Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000)) - studentAttendance.length,
            attendancePercentage: (studentAttendance.length / Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000))) * 100
          };
        })
      };

      return report;
    } catch (error) {
      console.error('Error generating attendance report:', error);
      throw error;
    }
  }

  async exportAttendanceReport(classId, startDate, endDate) {
    try {
      const report = await this.generateAttendanceReport(classId, startDate, endDate);
      // Here you would implement the export logic (e.g., to CSV, PDF, etc.)
      return report;
    } catch (error) {
      console.error('Error exporting attendance report:', error);
      throw error;
    }
  }

  async verifyLocation(location, sessionLocation) {
    try {
      // Create location record
      const locationRecord = new Location({
        coordinates: [location.longitude, location.latitude],
        accuracy: location.accuracy
      });

      // Validate against session location
      const validationResult = await locationRecord.validate({
        coordinates: [sessionLocation.coordinates[0], sessionLocation.coordinates[1]]
      });

      return validationResult === 'valid';
    } catch (error) {
      throw error;
    }
  }

  async verifyFace(userId, faceData) {
    try {
      // Get stored facial data
      const storedFacialData = await FacialData.getActive(userId);
      if (!storedFacialData) {
        throw new Error('No facial data found');
      }

      // Verify liveness
      const livenessScore = await this.verifyLiveness(faceData);
      if (livenessScore < 0.8) {
        throw new Error('Liveness check failed');
      }

      // Compare face descriptors
      const matchScore = await this.compareFaceDescriptors(
        faceData.descriptor,
        storedFacialData.faceDescriptor
      );

      // Update usage stats
      await storedFacialData.updateUsageStats(
        matchScore > 0.8 ? 'pass' : 'fail',
        matchScore
      );

      return {
        verified: matchScore > 0.8,
        confidence: matchScore,
        livenessScore
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyLiveness(faceData) {
    try {
      // TODO: Implement actual liveness detection
      // This is a placeholder that should be replaced with actual liveness detection
      return 0.95;
    } catch (error) {
      throw error;
    }
  }

  async compareFaceDescriptors(descriptor1, descriptor2) {
    try {
      // Calculate Euclidean distance between descriptors
      const distance = descriptor1.reduce((sum, value, i) => {
        return sum + Math.pow(value - descriptor2[i], 2);
      }, 0);
      
      // Convert distance to similarity score (0-1)
      const similarity = 1 / (1 + Math.sqrt(distance));
      return similarity;
    } catch (error) {
      throw error;
    }
  }

  async recordLocation(userId, sessionId, location) {
    try {
      const locationRecord = new Location({
        userId,
        sessionId,
        location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        },
        accuracy: location.accuracy,
        altitude: location.altitude,
        speed: location.speed,
        heading: location.heading,
        metadata: {
          provider: location.provider,
          networkType: location.networkType
        }
      });

      await locationRecord.save();
      return locationRecord;
    } catch (error) {
      throw error;
    }
  }

  async storeOnBlockchain(attendance) {
    try {
      const blockchainService = new BlockchainService();
      return await blockchainService.recordAttendance({
        userId: attendance.userId.toString(),
        sessionId: attendance.sessionId.toString(),
        timestamp: attendance.createdAt,
        status: attendance.status,
        location: attendance.location,
        verificationMethod: attendance.verificationMethod
      });
    } catch (error) {
      throw error;
    }
  }

  async sendNotifications(attendance) {
    try {
      const notificationService = new NotificationService();
      
      // Notify student
      await notificationService.create({
        userId: attendance.userId,
        type: 'attendance_marked',
        title: 'Attendance Marked',
        message: 'Your attendance has been successfully recorded',
        metadata: {
          attendanceId: attendance._id,
          sessionId: attendance.sessionId
        }
      });

      // TODO: Notify faculty and parents if needed
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  async verifyAttendanceRecord(attendanceId, verifierId) {
    try {
      const attendance = await Attendance.findById(attendanceId);
      if (!attendance) {
        throw new Error('Attendance record not found');
      }

      await attendance.verify(verifierId);
      return attendance;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AttendanceService();
