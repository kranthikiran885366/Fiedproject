const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Drop database route (for development only)
router.post('/drop-database', async (req, res) => {
  try {
    await mongoose.connection.db.dropDatabase();
    res.status(200).json({ message: 'Database dropped successfully' });
  } catch (error) {
    console.error('Error dropping database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
