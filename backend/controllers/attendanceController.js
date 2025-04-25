const Attendance = require('../models/Attendance');

exports.markAttendance = async (req, res) => {
  try {
    
    const { userId, date } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ error: 'userId and date are required' });
    }

    const attendance = new Attendance({ userId, date });
    await attendance.save();

    res.status(201).json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const records = await Attendance.find({ userId }).sort({ date: -1 });

    if (!records.length) {
      return res.status(404).json({ message: 'No attendance records found' });
    }

    res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
