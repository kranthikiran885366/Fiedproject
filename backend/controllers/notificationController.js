const Notification = require('../models/Notification');

exports.sendNotification = async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and userId are required' });
    }

    const notification = new Notification({ message, userId });
    await notification.save();

    res.status(201).json({ message: 'Notification sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
