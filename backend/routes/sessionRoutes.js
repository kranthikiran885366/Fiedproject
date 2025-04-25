const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

// Create a new session
router.post('/create', async (req, res) => {
  try {
    const newSession = new Session(req.body);
    await newSession.save();
    res.status(201).json({ message: 'Session created successfully', session: newSession });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate('classId')
      .populate('facultyId');
    res.status(200).json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get session by ID
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('classId')
      .populate('facultyId');
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.status(200).json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update session
router.put('/:id', async (req, res) => {
  try {
    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('classId').populate('facultyId');
    
    if (!updatedSession) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.status(200).json({ message: 'Session updated successfully', session: updatedSession });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start session
router.post('/:id/start', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    await session.startSession();
    res.status(200).json({ message: 'Session started successfully', session });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// End session
router.post('/:id/end', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    await session.endSession();
    res.status(200).json({ message: 'Session ended successfully', session });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete session
router.delete('/:id', async (req, res) => {
  try {
    const deletedSession = await Session.findByIdAndDelete(req.params.id);
    if (!deletedSession) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
