const Notification = require('../models/Notification');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const admin = require('firebase-admin');
const config = require('../config/notificationConfig');
const firebaseConfig = require('../config/firebaseConfig');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');

class NotificationService {
  constructor() {
    this.emailEnabled = false;
    this.smsEnabled = false;
    this.pushEnabled = false;
    this.initialize();
  }

  initialize() {
    // Initialize email service
    if (config.email.auth.user && config.email.auth.pass) {
      this.transporter = nodemailer.createTransport({
        service: config.email.service,
        auth: config.email.auth
      });
      this.emailEnabled = true;
      console.log('Email notification service initialized');
    } else {
      console.log('Email notification service disabled - missing credentials');
    }

    // Initialize SMS service
    if (config.twilio.accountSid && config.twilio.authToken) {
      try {
        this.twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
        this.smsEnabled = true;
        console.log('SMS notification service initialized');
      } catch (error) {
        console.error('Failed to initialize Twilio:', error);
        this.smsEnabled = false;
      }
    } else {
      console.log('SMS notification service disabled - missing credentials');
    }

    // Initialize push notification service
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      try {
        // Check if Firebase is already initialized
        if (!admin.apps.length) {
          const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: privateKey
            })
          });
        }
        this.pushEnabled = true;
        console.log('Push notification service initialized');
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        this.pushEnabled = false;
      }
    } else {
      console.log('Push notification service disabled - missing credentials');
      this.pushEnabled = false;
    }
  }

  async create(data) {
    try {
      const notification = new Notification({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || 'medium',
        metadata: data.metadata || {}
      });

      await notification.save();

      // Send notifications through all channels
      await Promise.all([
        this.sendEmail(notification),
        this.sendSMS(notification),
        this.sendPushNotification(notification)
      ]);

      return notification;
    } catch (error) {
      throw error;
    }
  }

  async sendEmail(notification) {
    if (!this.emailEnabled) {
      console.log('Email service is disabled');
      return false;
    }

    try {
      const user = await User.findById(notification.userId);
      if (!user || !user.email) return;

      const mailOptions = {
        from: config.email.from,
        to: user.email,
        subject: notification.title,
        html: this.generateEmailTemplate(notification)
      };

      const result = await this.transporter.sendMail(mailOptions);
      await notification.updateDeliveryStatus('email', true);
      return result;
    } catch (error) {
      console.error('Email notification error:', error);
      await notification.updateDeliveryStatus('email', false, error.message);
    }
  }

  async sendSMS(notification) {
    if (!this.smsEnabled) {
      console.log('SMS service is disabled');
      return false;
    }

    try {
      const user = await User.findById(notification.userId);
      if (!user || !user.phoneNumber) return;

      const result = await this.twilioClient.messages.create({
        body: this.generateSMSText(notification),
        from: config.twilio.phoneNumber,
        to: user.phoneNumber
      });

      await notification.updateDeliveryStatus('sms', true);
      return result;
    } catch (error) {
      console.error('SMS notification error:', error);
      await notification.updateDeliveryStatus('sms', false, error.message);
    }
  }

  async sendPushNotification(notification) {
    if (!this.pushEnabled) {
      console.log('Push notification service is disabled');
      return false;
    }

    try {
      const user = await User.findById(notification.userId);
      if (!user || !user.fcmToken) return;

      const message = {
        notification: {
          title: notification.title,
          body: notification.message
        },
        data: {
          type: notification.type,
          metadata: JSON.stringify(notification.metadata)
        },
        token: user.fcmToken
      };

      const result = await admin.messaging().send(message);
      await notification.updateDeliveryStatus('push', true);
      return result;
    } catch (error) {
      console.error('Push notification error:', error);
      await notification.updateDeliveryStatus('push', false, error.message);
    }
  }

  generateEmailTemplate(notification) {
    // TODO: Use a proper template engine
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        ${this.generateActionButton(notification)}
        <div style="margin-top: 20px; color: #666;">
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    `;
  }

  generateSMSText(notification) {
    return `${notification.title}: ${notification.message}`;
  }

  generateActionButton(notification) {
    if (!notification.metadata.actionUrl) return '';

    return `
      <a href="${notification.metadata.actionUrl}"
         style="display: inline-block;
                padding: 10px 20px;
                background-color: #007bff;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 15px;">
        ${notification.metadata.actionType || 'View Details'}
      </a>
    `;
  }

  async getUnreadNotifications(userId) {
    try {
      return await Notification.getUnread(userId);
    } catch (error) {
      throw error;
    }
  }

  async markAsRead(notificationId) {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.markAsRead();
      return notification;
    } catch (error) {
      throw error;
    }
  }

  async deleteNotification(notificationId) {
    try {
      const result = await Notification.findByIdAndDelete(notificationId);
      if (!result) {
        throw new Error('Notification not found');
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getNotificationStats(userId) {
    try {
      return await Notification.getStatistics(userId);
    } catch (error) {
      throw error;
    }
  }

  // Send email notification
  async sendEmailNotification(to, subject, html) {
    if (!this.emailEnabled) {
      console.log('Email service is disabled');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html
      });
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  // Send low attendance warning
  async sendLowAttendanceWarning(studentId, classId) {
    const student = await User.findById(studentId);
    const classInfo = await Class.findById(classId);
    const attendance = await Attendance.find({ studentId, classId });
    
    const attendancePercentage = (attendance.filter(a => a.status === 'present').length / attendance.length) * 100;
    
    if (attendancePercentage < 75) {
      const html = `
        <h2>Low Attendance Warning</h2>
        <p>Dear ${student.name},</p>
        <p>Your attendance in ${classInfo.name} is currently at ${attendancePercentage.toFixed(2)}%.</p>
        <p>Please ensure you attend the upcoming classes to maintain the required attendance percentage.</p>
        <p>Best regards,<br>Attendance System</p>
      `;
      
      await this.sendEmailNotification(student.email, 'Low Attendance Warning', html);
    }
  }

  // Send class reminder
  async sendClassReminder(classId) {
    const classInfo = await Class.findById(classId);
    const students = await User.find({ role: 'student' });
    
    const html = `
      <h2>Class Reminder</h2>
      <p>Dear Student,</p>
      <p>This is a reminder that you have ${classInfo.name} scheduled for tomorrow.</p>
      <p>Time: ${classInfo.schedule[0].startTime}</p>
      <p>Location: ${classInfo.location || 'Regular classroom'}</p>
      <p>Best regards,<br>Attendance System</p>
    `;
    
    for (const student of students) {
      await this.sendEmailNotification(student.email, 'Class Reminder', html);
    }
  }

  // Send attendance summary
  async sendAttendanceSummary(classId, date) {
    const classInfo = await Class.findById(classId);
    const attendance = await Attendance.find({ classId, date });
    
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    
    const html = `
      <h2>Attendance Summary for ${classInfo.name}</h2>
      <p>Date: ${date}</p>
      <p>Total Students: ${attendance.length}</p>
      <p>Present: ${presentCount}</p>
      <p>Absent: ${absentCount}</p>
      <p>Attendance Rate: ${((presentCount / attendance.length) * 100).toFixed(2)}%</p>
      <p>Best regards,<br>Attendance System</p>
    `;
    
    const faculty = await User.find({ role: 'faculty' });
    for (const teacher of faculty) {
      await this.sendEmailNotification(teacher.email, 'Daily Attendance Summary', html);
    }
  }

  // Send correction request notification
  async sendCorrectionRequestNotification(requestId, facultyId) {
    const faculty = await User.findById(facultyId);
    const request = await Attendance.findById(requestId);
    const student = await User.findById(request.studentId);
    
    const html = `
      <h2>New Attendance Correction Request</h2>
      <p>Dear ${faculty.name},</p>
      <p>Student ${student.name} has submitted a correction request for their attendance on ${request.date}.</p>
      <p>Please review and take appropriate action.</p>
      <p>Best regards,<br>Attendance System</p>
    `;
    
    await this.sendEmailNotification(faculty.email, 'New Correction Request', html);
  }

  async sendAttendanceNotification(studentId, classId, status) {
    try {
      const student = await User.findById(studentId);
      const classInfo = await Class.findById(classId);

      if (!student || !classInfo) {
        throw new Error('Student or class not found');
      }

      // Send email notification
      await this.sendEmailNotification(student, classInfo, status);

      // Send SMS notification if phone number exists
      if (student.phone) {
        await this.sendSMSNotification(student, classInfo, status);
      }

      // Send in-app notification
      await this.sendInAppNotification(studentId, classId, status);

      console.log(`Attendance notification sent to student ${studentId}`);
    } catch (error) {
      console.error('Error sending attendance notification:', error);
      throw error;
    }
  }

  async sendEmailNotification(student, classInfo, status) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: `Attendance Update - ${classInfo.name}`,
      html: this.generateEmailContent(student, classInfo, status)
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendSMSNotification(student, classInfo, status) {
    const message = this.generateSMSContent(student, classInfo, status);
    
    await this.twilioClient.messages.create({
      body: message,
      to: student.phone,
      from: process.env.TWILIO_PHONE_NUMBER
    });
  }

  async sendInAppNotification(studentId, classId, status) {
    // Implement in-app notification logic
    // This could be using WebSocket or a notification service
    console.log(`In-app notification sent to student ${studentId}`);
  }

  generateEmailContent(student, classInfo, status) {
    return `
      <h2>Attendance Update</h2>
      <p>Dear ${student.name},</p>
      <p>Your attendance for ${classInfo.name} has been marked as <strong>${status}</strong>.</p>
      <p>Date: ${new Date().toLocaleDateString()}</p>
      <p>Time: ${new Date().toLocaleTimeString()}</p>
      <p>If you believe this is an error, please contact your instructor.</p>
      <br>
      <p>Best regards,</p>
      <p>University Attendance System</p>
    `;
  }

  generateSMSContent(student, classInfo, status) {
    return `Attendance Update: ${classInfo.name} - ${status}. Date: ${new Date().toLocaleDateString()}`;
  }

  async sendLowAttendanceAlert(studentId, classId, attendancePercentage) {
    try {
      const student = await User.findById(studentId);
      const classInfo = await Class.findById(classId);

      if (!student || !classInfo) {
        throw new Error('Student or class not found');
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: 'Low Attendance Alert',
        html: this.generateLowAttendanceEmail(student, classInfo, attendancePercentage)
      };

      await this.transporter.sendMail(mailOptions);

      if (student.phone) {
        await this.twilioClient.messages.create({
          body: `Low Attendance Alert: Your attendance in ${classInfo.name} is ${attendancePercentage}%. Please improve your attendance.`,
          to: student.phone,
          from: process.env.TWILIO_PHONE_NUMBER
        });
      }

      console.log(`Low attendance alert sent to student ${studentId}`);
    } catch (error) {
      console.error('Error sending low attendance alert:', error);
      throw error;
    }
  }

  generateLowAttendanceEmail(student, classInfo, attendancePercentage) {
    return `
      <h2>Low Attendance Alert</h2>
      <p>Dear ${student.name},</p>
      <p>This is to inform you that your attendance in ${classInfo.name} is currently at ${attendancePercentage}%.</p>
      <p>Please note that maintaining good attendance is crucial for your academic success.</p>
      <p>We recommend that you attend all future classes to improve your attendance percentage.</p>
      <br>
      <p>If you have any concerns or need assistance, please contact your instructor.</p>
      <br>
      <p>Best regards,</p>
      <p>University Attendance System</p>
    `;
  }

  async sendClassReminder(classId) {
    try {
      const classInfo = await Class.findById(classId);
      const students = await User.find({ role: 'student' });

      for (const student of students) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: student.email,
          subject: `Class Reminder - ${classInfo.name}`,
          html: this.generateClassReminderEmail(student, classInfo)
        };

        await this.transporter.sendMail(mailOptions);

        if (student.phone) {
          await this.twilioClient.messages.create({
            body: `Reminder: ${classInfo.name} class is scheduled for today.`,
            to: student.phone,
            from: process.env.TWILIO_PHONE_NUMBER
          });
        }
      }

      console.log(`Class reminders sent for ${classInfo.name}`);
    } catch (error) {
      console.error('Error sending class reminders:', error);
      throw error;
    }
  }

  generateClassReminderEmail(student, classInfo) {
    return `
      <h2>Class Reminder</h2>
      <p>Dear ${student.name},</p>
      <p>This is a reminder that you have ${classInfo.name} class today.</p>
      <p>Time: ${classInfo.schedule.time}</p>
      <p>Location: ${classInfo.location}</p>
      <br>
      <p>Please ensure you arrive on time for attendance marking.</p>
      <br>
      <p>Best regards,</p>
      <p>University Attendance System</p>
    `;
  }
}

module.exports = new NotificationService();
