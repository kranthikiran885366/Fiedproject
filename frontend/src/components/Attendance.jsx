import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Container,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Stack
} from '@mui/material';
import {
  Camera as CameraIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useAttendance } from '../contexts/AttendanceContext';
import WebcamCapture from './WebcamCapture';

const Attendance = () => {
  const { markAttendance, loading, error, fetchAttendanceStats } = useAttendance();
  const [photo, setPhoto] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [locationStatus, setLocationStatus] = useState('checking');
  const [faceStatus, setFaceStatus] = useState('checking');
  const [timeStatus, setTimeStatus] = useState('checking');

  // Fetch attendance stats when component mounts
  useEffect(() => {
    fetchAttendanceStats();
  }, [fetchAttendanceStats]);

  // Handle error messages
  useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error'
      });
    }
  }, [error]);

  // Simulate verification checks
  useEffect(() => {
    const verifyRequirements = async () => {
      try {
        // Simulate location check
        setLocationStatus('checking');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLocationStatus('success');

        // Simulate face verification
        setFaceStatus('checking');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setFaceStatus('success');

        // Simulate time verification
        setTimeStatus('checking');
        await new Promise(resolve => setTimeout(resolve, 800));
        setTimeStatus('success');
      } catch (error) {
        console.error('Verification failed:', error);
        setLocationStatus('error');
        setFaceStatus('error');
        setTimeStatus('error');
      }
    };

    if (photo) {
      verifyRequirements();
    }
  }, [photo]);

  const handlePhotoCapture = (capturedPhoto) => {
    setPhoto(capturedPhoto);
    setShowWebcam(false);
  };

  const handleMarkAttendance = async () => {
    if (!photo) {
      setSnackbar({
        open: true,
        message: 'Please capture a photo first',
        severity: 'warning'
      });
      return;
    }

    if (locationStatus !== 'success' || faceStatus !== 'success' || timeStatus !== 'success') {
      setSnackbar({
        open: true,
        message: 'Please ensure all verification checks pass',
        severity: 'warning'
      });
      return;
    }

    try {
      await markAttendance(photo);
      setSnackbar({
        open: true,
        message: 'Attendance marked successfully!',
        severity: 'success'
      });
      setPhoto(null);
      fetchAttendanceStats();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to mark attendance',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleRetry = () => {
    setPhoto(null);
    setShowWebcam(true);
    setLocationStatus('checking');
    setFaceStatus('checking');
    setTimeStatus('checking');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'checking':
        return <CircularProgress size={20} />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2">
                Mark Attendance
              </Typography>
              {photo && (
                <Tooltip title="Retry">
                  <IconButton onClick={handleRetry} color="primary">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              {showWebcam ? (
                <WebcamCapture onCapture={handlePhotoCapture} />
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CameraIcon />}
                  onClick={() => setShowWebcam(true)}
                >
                  Take Photo
                </Button>
              )}
            </Box>
          </Grid>

          {photo && (
            <>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <img
                    src={photo}
                    alt="Captured"
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: 300,
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Verification Status
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LocationIcon color="primary" />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2">Location Verification</Typography>
                          <LinearProgress
                            variant={locationStatus === 'checking' ? 'indeterminate' : 'determinate'}
                            value={locationStatus === 'success' ? 100 : 0}
                            color={locationStatus === 'success' ? 'success' : 'primary'}
                            sx={{ mt: 1 }}
                          />
                          <Chip 
                            label={locationStatus.toUpperCase()} 
                            color={locationStatus === 'success' ? 'success' : locationStatus === 'error' ? 'error' : 'primary'}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                        {getStatusIcon(locationStatus)}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CameraIcon color="primary" />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2">Face Verification</Typography>
                          <LinearProgress
                            variant={faceStatus === 'checking' ? 'indeterminate' : 'determinate'}
                            value={faceStatus === 'success' ? 100 : 0}
                            color={faceStatus === 'success' ? 'success' : 'primary'}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                        {getStatusIcon(faceStatus)}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TimerIcon color="primary" />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2">Time Verification</Typography>
                          <LinearProgress
                            variant={timeStatus === 'checking' ? 'indeterminate' : 'determinate'}
                            value={timeStatus === 'success' ? 100 : 0}
                            color={timeStatus === 'success' ? 'success' : 'primary'}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                        {getStatusIcon(timeStatus)}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleMarkAttendance}
                disabled={loading || !photo || locationStatus !== 'success' || faceStatus !== 'success' || timeStatus !== 'success'}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Marking Attendance...' : 'Mark Attendance'}
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default Attendance; 