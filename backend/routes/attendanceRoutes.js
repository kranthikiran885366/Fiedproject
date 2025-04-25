const express = require('express');
const router = express.Router();
const attendanceService = require('../services/attendanceService');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Mark attendance
router.post('/mark', auth, async (req, res) => {
  try {
    const { studentId, classId, timestamp, status } = req.body;
    const result = await attendanceService.markAttendance(studentId, classId, timestamp, status);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance statistics
router.get('/stats/:classId/:date', auth, async (req, res) => {
  try {
    const stats = await attendanceService.getAttendanceStats(req.params.classId, req.params.date);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student attendance
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const attendance = await attendanceService.getStudentAttendance(
      req.params.studentId,
      new Date(startDate),
      new Date(endDate)
    );
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get class attendance
router.get('/class/:classId/:date', auth, async (req, res) => {
  try {
    const attendance = await attendanceService.getClassAttendance(req.params.classId, req.params.date);
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance trends
router.get('/trends', auth, async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const trends = await attendanceService.getAttendanceTrends(
      classId,
      new Date(startDate),
      new Date(endDate)
    );
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get class distribution
router.get('/distribution', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const distribution = await attendanceService.getClassDistribution(new Date(date));
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate attendance report
router.get('/report', [auth, role(['admin', 'faculty'])], async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const report = await attendanceService.generateAttendanceReport(
      classId,
      new Date(startDate),
      new Date(endDate)
    );
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export attendance report
router.get('/export', [auth, role(['admin', 'faculty'])], async (req, res) => {
  try {
    const { classId, startDate, endDate, format } = req.query;
    const report = await attendanceService.exportAttendanceReport(
      classId,
      new Date(startDate),
      new Date(endDate),
      format
    );
    
    // Set appropriate headers based on format
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.csv');
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.pdf');
    }
    
    res.send(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance alerts
router.get('/alerts', auth, async (req, res) => {
  try {
    const { classId, date } = req.query;
    const alerts = await attendanceService.getAttendanceAlerts(classId, new Date(date));
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance summary
router.get('/summary', auth, async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const summary = await attendanceService.getAttendanceSummary(
      classId,
      new Date(startDate),
      new Date(endDate)
    );
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
