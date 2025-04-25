import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { getClasses, addClass, updateClass, deleteClass } from '../../services/api';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    course: '',
    schedule: ''
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await getClasses();
      setClasses(response.data);
    } catch (err) {
      setError('Failed to load classes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (classData = null) => {
    if (classData) {
      setSelectedClass(classData);
      setFormData({
        name: classData.name,
        course: classData.course,
        schedule: classData.schedule
      });
    } else {
      setSelectedClass(null);
      setFormData({ name: '', course: '', schedule: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClass(null);
    setFormData({ name: '', course: '', schedule: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedClass) {
        await updateClass(selectedClass._id, formData);
      } else {
        await addClass(formData);
      }
      handleCloseDialog();
      fetchClasses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save class');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await deleteClass(id);
        fetchClasses();
      } catch (err) {
        setError('Failed to delete class');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Classes</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
          Add New Class
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Class Name</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Schedule</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.map((classItem) => (
              <TableRow key={classItem._id}>
                <TableCell>{classItem.name}</TableCell>
                <TableCell>{classItem.course}</TableCell>
                <TableCell>{classItem.schedule}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(classItem)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(classItem._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{selectedClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Class Name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Course"
              name="course"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Schedule"
              name="schedule"
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              required
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedClass ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Classes; 