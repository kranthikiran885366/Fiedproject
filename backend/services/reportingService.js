const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Class = require('../models/Class');
const moment = require('moment');
const ExcelJS = require('exceljs');

class ReportingService {
    constructor() {}

    // Generate comprehensive attendance report
    async generateAttendanceReport(classId, startDate, endDate) {
        try {
            const attendance = await Attendance.find({
                classId,
                date: { $gte: startDate, $lte: endDate }
            }).populate('studentId', 'name rollNumber');

            const classInfo = await Class.findById(classId);
            const students = await User.find({ role: 'student' });

            // Calculate attendance statistics
            const stats = this.calculateAttendanceStats(attendance, students);
            
            // Generate trends
            const trends = await this.generateAttendanceTrends(classId, startDate, endDate);
            
            // Generate student performance analysis
            const performance = await this.analyzeStudentPerformance(classId, startDate, endDate);
            
            // Generate recommendations
            const recommendations = this.generateReportRecommendations(stats, trends, performance);

            return {
                classInfo,
                dateRange: { startDate, endDate },
                statistics: stats,
                trends,
                performance,
                recommendations
            };
        } catch (error) {
            console.error('Report generation failed:', error);
            throw error;
        }
    }

    // Calculate attendance statistics
    calculateAttendanceStats(attendance, students) {
        const stats = {
            totalClasses: new Set(attendance.map(a => a.date)).size,
            totalStudents: students.length,
            attendanceRate: 0,
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            byDay: {},
            byStudent: {}
        };

        attendance.forEach(record => {
            const day = moment(record.date).format('dddd');
            stats.byDay[day] = (stats.byDay[day] || { present: 0, total: 0 });
            stats.byDay[day].total++;
            if (record.status === 'present') {
                stats.presentCount++;
                stats.byDay[day].present++;
            } else if (record.status === 'absent') {
                stats.absentCount++;
            } else if (record.status === 'late') {
                stats.lateCount++;
            }

            // Student-wise stats
            const studentId = record.studentId._id.toString();
            stats.byStudent[studentId] = stats.byStudent[studentId] || {
                name: record.studentId.name,
                rollNumber: record.studentId.rollNumber,
                present: 0,
                absent: 0,
                late: 0,
                total: 0
            };
            stats.byStudent[studentId].total++;
            if (record.status === 'present') stats.byStudent[studentId].present++;
            else if (record.status === 'absent') stats.byStudent[studentId].absent++;
            else if (record.status === 'late') stats.byStudent[studentId].late++;
        });

        stats.attendanceRate = (stats.presentCount / (stats.presentCount + stats.absentCount)) * 100;

        return stats;
    }

    // Generate attendance trends
    async generateAttendanceTrends(classId, startDate, endDate) {
        const trends = {
            daily: [],
            weekly: [],
            monthly: []
        };

        const attendance = await Attendance.find({
            classId,
            date: { $gte: startDate, $lte: endDate }
        });

        // Daily trends
        const dailyStats = {};
        attendance.forEach(record => {
            const date = moment(record.date).format('YYYY-MM-DD');
            dailyStats[date] = dailyStats[date] || { present: 0, total: 0 };
            dailyStats[date].total++;
            if (record.status === 'present') dailyStats[date].present++;
        });

        trends.daily = Object.entries(dailyStats).map(([date, stats]) => ({
            date,
            attendanceRate: (stats.present / stats.total) * 100
        }));

        // Weekly trends
        const weeklyStats = {};
        attendance.forEach(record => {
            const week = moment(record.date).format('YYYY-[W]WW');
            weeklyStats[week] = weeklyStats[week] || { present: 0, total: 0 };
            weeklyStats[week].total++;
            if (record.status === 'present') weeklyStats[week].present++;
        });

        trends.weekly = Object.entries(weeklyStats).map(([week, stats]) => ({
            week,
            attendanceRate: (stats.present / stats.total) * 100
        }));

        // Monthly trends
        const monthlyStats = {};
        attendance.forEach(record => {
            const month = moment(record.date).format('YYYY-MM');
            monthlyStats[month] = monthlyStats[month] || { present: 0, total: 0 };
            monthlyStats[month].total++;
            if (record.status === 'present') monthlyStats[month].present++;
        });

        trends.monthly = Object.entries(monthlyStats).map(([month, stats]) => ({
            month,
            attendanceRate: (stats.present / stats.total) * 100
        }));

        return trends;
    }

    // Analyze student performance
    async analyzeStudentPerformance(classId, startDate, endDate) {
        const students = await User.find({ role: 'student' });
        const attendance = await Attendance.find({
            classId,
            date: { $gte: startDate, $lte: endDate }
        });

        const performance = students.map(student => {
            const studentAttendance = attendance.filter(a => a.studentId.toString() === student._id.toString());
            const presentCount = studentAttendance.filter(a => a.status === 'present').length;
            const totalCount = studentAttendance.length;
            const attendanceRate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

            return {
                studentId: student._id,
                name: student.name,
                rollNumber: student.rollNumber,
                attendanceRate,
                presentCount,
                totalCount,
                performance: this.calculatePerformanceLevel(attendanceRate)
            };
        });

        return performance.sort((a, b) => b.attendanceRate - a.attendanceRate);
    }

    // Calculate performance level
    calculatePerformanceLevel(attendanceRate) {
        if (attendanceRate >= 90) return 'Excellent';
        if (attendanceRate >= 75) return 'Good';
        if (attendanceRate >= 60) return 'Fair';
        return 'Poor';
    }

    // Generate report recommendations
    generateReportRecommendations(stats, trends, performance) {
        const recommendations = [];

        // Overall attendance recommendations
        if (stats.attendanceRate < 75) {
            recommendations.push({
                type: 'overall_attendance',
                priority: 'high',
                action: 'Implement attendance improvement measures',
                details: `Current attendance rate: ${stats.attendanceRate.toFixed(2)}%`
            });
        }

        // Day-specific recommendations
        Object.entries(stats.byDay).forEach(([day, data]) => {
            const dayRate = (data.present / data.total) * 100;
            if (dayRate < 70) {
                recommendations.push({
                    type: 'day_specific',
                    priority: 'medium',
                    action: `Review ${day} class schedule`,
                    details: `Low attendance on ${day}s: ${dayRate.toFixed(2)}%`
                });
            }
        });

        // Student-specific recommendations
        performance.forEach(student => {
            if (student.attendanceRate < 60) {
                recommendations.push({
                    type: 'student_specific',
                    priority: 'high',
                    action: `Intervene with ${student.name}`,
                    details: `Attendance rate: ${student.attendanceRate.toFixed(2)}%`
                });
            }
        });

        return recommendations;
    }

    // Export report to Excel
    async exportToExcel(report, filename) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendance Report');

        // Add headers
        worksheet.columns = [
            { header: 'Student Name', key: 'name', width: 20 },
            { header: 'Roll Number', key: 'rollNumber', width: 15 },
            { header: 'Attendance Rate', key: 'attendanceRate', width: 15 },
            { header: 'Present', key: 'present', width: 10 },
            { header: 'Absent', key: 'absent', width: 10 },
            { header: 'Late', key: 'late', width: 10 },
            { header: 'Performance', key: 'performance', width: 15 }
        ];

        // Add data
        Object.values(report.statistics.byStudent).forEach(student => {
            worksheet.addRow({
                name: student.name,
                rollNumber: student.rollNumber,
                attendanceRate: `${((student.present / student.total) * 100).toFixed(2)}%`,
                present: student.present,
                absent: student.absent,
                late: student.late,
                performance: this.calculatePerformanceLevel((student.present / student.total) * 100)
            });
        });

        // Save the workbook
        await workbook.xlsx.writeFile(filename);
        return filename;
    }
}

module.exports = new ReportingService(); 