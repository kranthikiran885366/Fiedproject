const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/studentController');
const { authenticateToken } = require('../middleware/auth');

// Get student attendance history
router.get('/:studentId/attendance', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 10, status, dateRange } = req.query;

    const attendanceRecords = await StudentController.getAttendanceHistory(
      studentId,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        dateRange
      }
    );

    res.json(attendanceRecords);
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({ error: 'Failed to fetch attendance history' });
  }
});

// Export attendance history
router.get('/:studentId/attendance/export', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const attendanceRecords = await StudentController.exportAttendanceHistory(studentId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_history_${studentId}.csv`);
    res.send(attendanceRecords);
  } catch (error) {
    console.error('Error exporting attendance history:', error);
    res.status(500).json({ error: 'Failed to export attendance history' });
  }
});

module.exports = router; 