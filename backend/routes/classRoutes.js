const express = require('express');
const router = express.Router();
const Class = require('../models/Class');

// Create a new class
router.post('/create', async (req, res) => {
  try {
    const newClass = new Class(req.body);
    await newClass.save();
    res.status(201).json({ message: 'Class created successfully', class: newClass });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all classes
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find();
    res.status(200).json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get class by ID
router.get('/:id', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.status(200).json(classData);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update class
router.put('/:id', async (req, res) => {
  try {
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.status(200).json({ message: 'Class updated successfully', class: updatedClass });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete class
router.delete('/:id', async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    if (!deletedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.status(200).json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
