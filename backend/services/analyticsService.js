const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Class = require('../models/Class');

class AnalyticsService {
    constructor() {
        this.attendanceThreshold = 0.75; // 75% attendance required
    }

    async getClassAttendanceStats(classId, startDate, endDate) {
        try {
            const attendance = await Attendance.find({
                classId,
                date: { $gte: startDate, $lte: endDate }
            });

            const students = await User.find({ role: 'student' });
            const classInfo = await Class.findById(classId);

            const stats = {
                totalClasses: this.calculateTotalClasses(startDate, endDate, classInfo.schedule),
                attendanceByStudent: this.calculateAttendanceByStudent(attendance, students),
                overallAttendance: this.calculateOverallAttendance(attendance, students.length),
                trends: this.analyzeAttendanceTrends(attendance),
                alerts: this.generateAttendanceAlerts(attendance, students)
            };

            return stats;
        } catch (error) {
            console.error('Error getting attendance stats:', error);
            throw error;
        }
    }

    calculateTotalClasses(startDate, endDate, schedule) {
        // Calculate total number of classes based on schedule
        const start = new Date(startDate);
        const end = new Date(endDate);
        let total = 0;

        while (start <= end) {
            if (schedule.days.includes(start.getDay())) {
                total++;
            }
            start.setDate(start.getDate() + 1);
        }

        return total;
    }

    calculateAttendanceByStudent(attendance, students) {
        const stats = {};

        students.forEach(student => {
            const studentAttendance = attendance.filter(a => a.studentId === student._id.toString());
            const presentCount = studentAttendance.filter(a => a.status === 'present').length;
            const totalClasses = this.calculateTotalClasses(
                attendance[0]?.date,
                attendance[attendance.length - 1]?.date,
                { days: [0, 1, 2, 3, 4, 5, 6] } // Assuming daily classes
            );

            stats[student._id] = {
                name: student.name,
                present: presentCount,
                absent: totalClasses - presentCount,
                percentage: (presentCount / totalClasses) * 100
            };
        });

        return stats;
    }

    calculateOverallAttendance(attendance, totalStudents) {
        const totalClasses = new Set(attendance.map(a => a.date)).size;
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const totalPossibleAttendance = totalClasses * totalStudents;

        return {
            present: presentCount,
            absent: totalPossibleAttendance - presentCount,
            percentage: (presentCount / totalPossibleAttendance) * 100
        };
    }

    analyzeAttendanceTrends(attendance) {
        const trends = {
            daily: {},
            weekly: {},
            monthly: {}
        };

        attendance.forEach(record => {
            const date = new Date(record.date);
            
            // Daily trend
            const dayKey = date.toISOString().split('T')[0];
            trends.daily[dayKey] = (trends.daily[dayKey] || 0) + 1;

            // Weekly trend
            const weekKey = this.getWeekNumber(date);
            trends.weekly[weekKey] = (trends.weekly[weekKey] || 0) + 1;

            // Monthly trend
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            trends.monthly[monthKey] = (trends.monthly[monthKey] || 0) + 1;
        });

        return trends;
    }

    generateAttendanceAlerts(attendance, students) {
        const alerts = [];
        const studentStats = this.calculateAttendanceByStudent(attendance, students);

        Object.entries(studentStats).forEach(([studentId, stats]) => {
            if (stats.percentage < this.attendanceThreshold * 100) {
                alerts.push({
                    studentId,
                    name: stats.name,
                    currentPercentage: stats.percentage,
                    requiredPercentage: this.attendanceThreshold * 100,
                    message: `Attendance below threshold (${stats.percentage.toFixed(2)}%)`
                });
            }
        });

        return alerts;
    }

    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    async getStudentAttendanceHistory(studentId, startDate, endDate) {
        try {
            const attendance = await Attendance.find({
                studentId,
                date: { $gte: startDate, $lte: endDate }
            }).sort({ date: 1 });

            return {
                records: attendance,
                stats: this.calculateStudentStats(attendance)
            };
        } catch (error) {
            console.error('Error getting student attendance history:', error);
            throw error;
        }
    }

    calculateStudentStats(attendance) {
        const totalClasses = new Set(attendance.map(a => a.date)).size;
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const absentCount = totalClasses - presentCount;

        return {
            totalClasses,
            present: presentCount,
            absent: absentCount,
            percentage: (presentCount / totalClasses) * 100,
            streak: this.calculateAttendanceStreak(attendance)
        };
    }

    calculateAttendanceStreak(attendance) {
        let currentStreak = 0;
        let longestStreak = 0;
        let lastDate = null;

        attendance.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(record => {
            if (record.status === 'present') {
                if (!lastDate || this.isConsecutiveDay(lastDate, record.date)) {
                    currentStreak++;
                    longestStreak = Math.max(longestStreak, currentStreak);
                } else {
                    currentStreak = 1;
                }
            } else {
                currentStreak = 0;
            }
            lastDate = record.date;
        });

        return longestStreak;
    }

    isConsecutiveDay(date1, date2) {
        const day1 = new Date(date1);
        const day2 = new Date(date2);
        const diffTime = Math.abs(day2 - day1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays === 1;
    }
}

module.exports = AnalyticsService;
