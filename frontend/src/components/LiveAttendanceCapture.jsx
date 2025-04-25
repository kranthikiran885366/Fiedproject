import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Stack,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Videocam, 
  VideocamOff, 
  CheckCircle, 
  Error as ErrorIcon,
  Warning as WarningIcon 
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';

const VideoContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: 800,
  margin: '1rem auto',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  backgroundColor: theme.palette.grey[900],
}));

const Video = styled('video')({
  width: '100%',
  borderRadius: 'inherit',
});

const StatusOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  display: 'flex',
  gap: '0.5rem',
}));

const LiveAttendanceCapture = () => {
  const [stream, setStream] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState({
    faceDetected: false,
    faceMatched: false,
    locationVerified: false,
    timeVerified: false,
  });
  const [recognizedStudents, setRecognizedStudents] = useState([]);
  const videoRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCapturing(true);
      setError('');
      startFaceRecognition();
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Error accessing camera. Please ensure you have granted camera permissions.');
      enqueueSnackbar('Error accessing camera', { variant: 'error' });
    }
  };

  const stopCapture = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsCapturing(false);
    setRecognizedStudents([]);
    setAttendanceStatus({
      faceDetected: false,
      faceMatched: false,
      locationVerified: false,
      timeVerified: false,
    });
  };

  const startFaceRecognition = () => {
    // Simulate face recognition process
    const recognitionInterval = setInterval(() => {
      if (!isCapturing) {
        clearInterval(recognitionInterval);
        return;
      }

      // Simulate face detection and recognition
      const randomMatch = Math.random() > 0.5;
      if (randomMatch) {
        setAttendanceStatus(prev => ({
          ...prev,
          faceDetected: true,
          faceMatched: true,
        }));
        
        // Simulate finding a student
        const student = {
          id: Math.floor(Math.random() * 1000),
          name: `Student ${Math.floor(Math.random() * 100)}`,
          department: 'CSE',
          timestamp: new Date().toISOString(),
        };
        
        setRecognizedStudents(prev => {
          if (!prev.find(s => s.id === student.id)) {
            return [...prev, student];
          }
          return prev;
        });
      }
    }, 2000);

    // Simulate location verification
    const locationInterval = setInterval(() => {
      if (!isCapturing) {
        clearInterval(locationInterval);
        return;
      }
      setAttendanceStatus(prev => ({
        ...prev,
        locationVerified: true,
      }));
    }, 5000);

    // Simulate time verification
    const timeInterval = setInterval(() => {
      if (!isCapturing) {
        clearInterval(timeInterval);
        return;
      }
      setAttendanceStatus(prev => ({
        ...prev,
        timeVerified: true,
      }));
    }, 3000);
  };

  const markAttendance = async () => {
    setLoading(true);
    try {
      // Simulate API call to mark attendance
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      enqueueSnackbar('Attendance marked successfully!', { variant: 'success' });
      stopCapture();
    } catch (error) {
      enqueueSnackbar('Error marking attendance', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Live Attendance Capture
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <VideoContainer>
              {isCapturing ? (
                <Video ref={videoRef} autoPlay playsInline />
              ) : (
                <Box
                  sx={{
                    height: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'grey.900',
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    Camera Off
                  </Typography>
                </Box>
              )}
              <StatusOverlay>
                <Chip
                  icon={attendanceStatus.faceDetected ? <CheckCircle /> : <ErrorIcon />}
                  label="Face Detection"
                  color={attendanceStatus.faceDetected ? "success" : "error"}
                />
                <Chip
                  icon={attendanceStatus.faceMatched ? <CheckCircle /> : <ErrorIcon />}
                  label="Face Match"
                  color={attendanceStatus.faceMatched ? "success" : "error"}
                />
                <Chip
                  icon={attendanceStatus.locationVerified ? <CheckCircle /> : <WarningIcon />}
                  label="Location"
                  color={attendanceStatus.locationVerified ? "success" : "warning"}
                />
                <Chip
                  icon={attendanceStatus.timeVerified ? <CheckCircle /> : <WarningIcon />}
                  label="Time"
                  color={attendanceStatus.timeVerified ? "success" : "warning"}
                />
              </StatusOverlay>
            </VideoContainer>

            <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
              {!isCapturing ? (
                <Button
                  variant="contained"
                  startIcon={<Videocam />}
                  onClick={startCapture}
                  disabled={loading}
                >
                  Start Capture
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<VideocamOff />}
                  onClick={stopCapture}
                  disabled={loading}
                >
                  Stop Capture
                </Button>
              )}
              <Button
                variant="contained"
                color="success"
                onClick={markAttendance}
                disabled={!isCapturing || loading || !attendanceStatus.faceMatched}
              >
                {loading ? <CircularProgress size={24} /> : 'Mark Attendance'}
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recognized Students
                </Typography>
                <Stack spacing={2}>
                  {recognizedStudents.map((student) => (
                    <Card key={student.id} variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1">{student.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {student.department}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(student.timestamp).toLocaleTimeString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                  {recognizedStudents.length === 0 && (
                    <Typography variant="body2" color="text.secondary" align="center">
                      No students recognized yet
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default LiveAttendanceCapture; 