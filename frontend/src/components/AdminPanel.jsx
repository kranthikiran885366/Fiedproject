import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  People as PeopleIcon,
  Class as ClassIcon,
} from '@mui/icons-material';
import { useAttendance } from '../contexts/AttendanceContext';
import { useSnackbar } from 'notistack';

const AdminPanel = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState({
    classId: '',
    subject: '',
    duration: 60,
  });

  const {
    currentSession,
    startAttendanceSession,
    endAttendanceSession,
    attendanceHistory,
  } = useAttendance();

  const { enqueueSnackbar } = useSnackbar();

  const handleStartSession = async () => {
    try {
      setLoading(true);
      setError(null);
      await startAttendanceSession(sessionData);
      enqueueSnackbar('Attendance session started successfully!', { variant: 'success' });
    } catch (err) {
      setError(err.message);
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    try {
      setLoading(true);
      setError(null);
      await endAttendanceSession();
      enqueueSnackbar('Attendance session ended successfully!', { variant: 'success' });
    } catch (err) {
      setError(err.message);
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Session Management
              </Typography>
              {!currentSession ? (
                <>
                  <TextField
                    fullWidth
                    label="Class ID"
                    value={sessionData.classId}
                    onChange={(e) => setSessionData({ ...sessionData, classId: e.target.value })}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Subject"
                    value={sessionData.subject}
                    onChange={(e) => setSessionData({ ...sessionData, subject: e.target.value })}
                    margin="normal"
                  />
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Duration (minutes)</InputLabel>
                    <Select
                      value={sessionData.duration}
                      onChange={(e) => setSessionData({ ...sessionData, duration: e.target.value })}
                      label="Duration (minutes)"
                    >
                      <MenuItem value={30}>30 minutes</MenuItem>
                      <MenuItem value={60}>1 hour</MenuItem>
                      <MenuItem value={90}>1.5 hours</MenuItem>
                      <MenuItem value={120}>2 hours</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleStartSession}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <StartIcon />}
                    sx={{ mt: 2 }}
                  >
                    Start Session
                  </Button>
                </>
              ) : (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    Current Session: {currentSession.subject}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Class ID: {currentSession.classId}
                  </Typography>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleEndSession}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <StopIcon />}
                    sx={{ mt: 2 }}
                  >
                    End Session
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <PeopleIcon fontSize="large" color="primary" />
                    <Typography variant="h4">
                      {attendanceHistory?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Attendance
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <ClassIcon fontSize="large" color="secondary" />
                    <Typography variant="h4">
                      {currentSession ? 1 : 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Sessions
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminPanel; 