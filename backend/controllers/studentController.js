const Student = require('../models/student');
const Attendance = require('../models/attendance');
const { NotFoundError } = require('../utils/errors');

// ... existing code ...

exports.getAttendanceHistory = async (studentId, options) => {
  const { page, limit, status, dateRange } = options;
  const skip = (page - 1) * limit;

  const query = { student: studentId };
  
  if (status) {
    query.status = status;
  }

  if (dateRange) {
    const [startDate, endDate] = dateRange.split(',');
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const [attendanceRecords, total] = await Promise.all([
    Attendance.find(query)
      .sort({ date: -1, time: -1 })
      .skip(skip)
      .limit(limit)
      .populate('class', 'name subject')
      .lean(),
    Attendance.countDocuments(query)
  ]);

  return {
    records: attendanceRecords,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

exports.exportAttendanceHistory = async (studentId) => {
  const student = await Student.findById(studentId);
  if (!student) {
    throw new NotFoundError('Student not found');
  }

  const attendanceRecords = await Attendance.find({ student: studentId })
    .sort({ date: -1, time: -1 })
    .populate('class', 'name subject')
    .lean();

  // Convert records to CSV format
  const headers = ['Date', 'Class', 'Subject', 'Time', 'Status', 'Remarks'];
  const rows = attendanceRecords.map(record => [
    new Date(record.date).toLocaleDateString(),
    record.class.name,
    record.class.subject,
    new Date(record.time).toLocaleTimeString(),
    record.status,
    record.remarks || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
};

// ... existing code ... 