import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';

const ManualAttendance = () => {
  const [formData, setFormData] = useState({
    enrollmentNumber: '',
    department: '',
    class: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5),
    status: 'present',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [student, setStudent] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const searchStudent = async () => {
    if (!formData.enrollmentNumber) {
      setError('Please enter enrollment number');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to search student
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate student data
      setStudent({
        id: formData.enrollmentNumber,
        name: 'John Doe',
        department: 'CSE',
        class: 'A',
        photo: 'https://via.placeholder.com/150',
      });
      
      setError('');
    } catch (error) {
      setError('Error searching student');
      enqueueSnackbar('Error searching student', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async () => {
    if (!student) {
      setError('Please search for a student first');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to mark attendance
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      enqueueSnackbar('Attendance marked successfully!', { variant: 'success' });
      setStudent(null);
      setFormData({
        ...formData,
        enrollmentNumber: '',
        reason: '',
      });
    } catch (error) {
      enqueueSnackbar('Error marking attendance', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Manual Attendance Override
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Search Student
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Enrollment Number"
                    name="enrollmentNumber"
                    value={formData.enrollmentNumber}
                    onChange={handleChange}
                    margin="normal"
                  />
                  <Button
                    variant="contained"
                    onClick={searchStudent}
                    disabled={loading}
                    sx={{ mt: 2 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Search'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            {student ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Student Details
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      component="img"
                      src={student.photo}
                      alt={student.name}
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        mr: 2,
                      }}
                    />
                    <Box>
                      <Typography variant="subtitle1">{student.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {student.department} - Class {student.class}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <Typography variant="body1" color="text.secondary" align="center">
                    Search for a student to view details
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Mark Attendance
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        label="Status"
                      >
                        <MenuItem value="present">Present</MenuItem>
                        <MenuItem value="absent">Absent</MenuItem>
                        <MenuItem value="late">Late</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Reason (for absence/late)"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={markAttendance}
                    disabled={loading || !student}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Mark Attendance'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ManualAttendance; 