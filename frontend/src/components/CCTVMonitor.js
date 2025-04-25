import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Box, Button, Typography, Paper, Grid, Card, CardMedia, CardContent, IconButton, Tooltip, CircularProgress, Alert, Snackbar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { PlayArrow, Stop, Refresh, Settings, Notifications, Person, Schedule, BarChart } from '@mui/icons-material';
import path from 'path';
import axios from 'axios';
import { format, isWithinInterval } from 'date-fns';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

const DashboardContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '250px 1fr',
  minHeight: '100vh',
  background: theme.palette.background.default,
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr'
  }
}));

const Sidebar = styled(Paper)(({ theme }) => ({
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(2),
  boxShadow: theme.shadows[3],
  position: 'sticky',
  top: 0,
  height: '100vh',
  overflowY: 'auto'
}));

const MainContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  overflowY: 'auto',
  background: theme.palette.background.default
}));

const VideoContainer = styled(Card)(({ theme }) => ({
  position: 'relative',
  padding: 0,
  overflow: 'hidden',
  aspectRatio: '16/9',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[4]
}));

const Video = styled('video')({
  width: '100%',
  height: '100%',
  objectFit: 'cover'
});

const Overlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none'
});

const FaceBox = styled(Box)(({ theme, recognized }) => ({
  position: 'absolute',
  border: `2px solid ${recognized ? theme.palette.success.main : theme.palette.error.main}`,
  background: recognized ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
  padding: theme.spacing(1),
  color: theme.palette.common.white,
  fontSize: '0.8rem',
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

const Controls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  display: 'flex',
  gap: theme.spacing(1),
  zIndex: 1
}));

const StatsGrid = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(3)
}));

const StatCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)'
  }
}));

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 'bold',
  color: theme.palette.primary.main,
  margin: theme.spacing(1, 0)
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary
}));

const ScheduleList = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2)
}));

const ScheduleItem = styled(Paper)(({ theme, active }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  background: active ? theme.palette.primary.light : theme.palette.background.paper,
  color: active ? theme.palette.primary.contrastText : theme.palette.text.primary,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateX(5px)'
  }
}));

const NotificationBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: -5,
  right: -5,
  background: theme.palette.error.main,
  color: theme.palette.error.contrastText,
  borderRadius: '50%',
  width: 20,
  height: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem'
}));

const CCTVMonitor = ({ classId }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [status, setStatus] = useState('Idle');
  const [captures, setCaptures] = useState([]);
  const socket = useRef(null);
  const streamRef = useRef(null);
  const [schedule, setSchedule] = useState([]);
  const [currentClass, setCurrentClass] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({
    totalStudents: 0,
    present: 0,
    late: 0,
    absent: 0
  });
  const [attendanceTrends, setAttendanceTrends] = useState({
    labels: [],
    datasets: [{
      label: 'Attendance',
      data: [],
      borderColor: '#3498db',
      tension: 0.1
    }]
  });
  const [classDistribution, setClassDistribution] = useState({
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#2ecc71', '#f1c40f', '#e74c3c']
    }]
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize socket connection
    socket.current = io(process.env.REACT_APP_API_URL);

    // Cleanup on unmount
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (socket.current) {
      socket.current.on('face-detections', (data) => {
        setDetectedFaces(data.faces);
      });

      socket.current.on('attendance-marked', (data) => {
        setStatus(`Attendance marked for student ${data.studentId}`);
        // Add new capture to the list
        setCaptures(prevCaptures => [
          {
            studentId: data.studentId,
            timestamp: new Date(data.timestamp),
            imagePath: data.capturePath,
          },
          ...prevCaptures.slice(0, 9) // Keep only the last 10 captures
        ]);
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.all([
          fetchSchedule(),
          fetchAttendanceStats(),
          fetchAttendanceTrends(),
          fetchClassDistribution()
        ]);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await axios.get('/api/schedule');
      setSchedule(response.data);
      updateCurrentClass(response.data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      throw new Error('Failed to fetch schedule');
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const response = await axios.get('/api/attendance/stats');
      setAttendanceStats(response.data);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      throw new Error('Failed to fetch attendance stats');
    }
  };

  const fetchAttendanceTrends = async () => {
    try {
      const response = await axios.get('/api/attendance/trends');
      setAttendanceTrends({
        labels: response.data.labels,
        datasets: [{
          label: 'Attendance',
          data: response.data.data,
          borderColor: '#3498db',
          tension: 0.1
        }]
      });
    } catch (error) {
      console.error('Error fetching attendance trends:', error);
    }
  };

  const fetchClassDistribution = async () => {
    try {
      const response = await axios.get('/api/attendance/distribution');
      setClassDistribution({
        labels: response.data.labels,
        datasets: [{
          data: response.data.data,
          backgroundColor: ['#2ecc71', '#f1c40f', '#e74c3c']
        }]
      });
    } catch (error) {
      console.error('Error fetching class distribution:', error);
    }
  };

  const updateCurrentClass = (schedule) => {
    const now = new Date();
    const current = schedule.find(cls => {
      const startTime = new Date(cls.startTime);
      const endTime = new Date(cls.endTime);
      return isWithinInterval(now, { start: startTime, end: endTime });
    });
    setCurrentClass(current);
  };

  const handleFaceDetection = async (faces) => {
    if (!currentClass) return;

    const recognizedFaces = faces.filter(face => face.recognized);
    const now = new Date();
    const classStartTime = new Date(currentClass.startTime);
    const isLate = now.getTime() - classStartTime.getTime() > 15 * 60 * 1000; // 15 minutes grace period

    for (const face of recognizedFaces) {
      try {
        await axios.post('/api/attendance/mark', {
          studentId: face.studentId,
          classId: currentClass.id,
          timestamp: now,
          status: isLate ? 'late' : 'present'
        });
      } catch (error) {
        console.error('Error marking attendance:', error);
      }
    }

    fetchAttendanceStats();
  };

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsMonitoring(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied. Please ensure you have granted camera permissions.');
    }
  };

  const stopMonitoring = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsMonitoring(false);
      setError(null);
    } catch (err) {
      console.error('Error stopping monitoring:', err);
      setError('Error stopping camera stream');
    }
  };

  const detectFaces = async () => {
    if (!isMonitoring || !videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const response = await axios.post('/api/cctv/detect', {
        image: canvas.toDataURL('image/jpeg')
      });

      if (response.data.success) {
        setDetectedFaces(response.data.faces);
        handleFaceDetection(response.data.faces);
      }

      requestAnimationFrame(detectFaces);
    } catch (err) {
      console.error('Face detection error:', err);
      setError('Error processing face detection');
    }
  };

  if (error) {
    return (
      <ErrorBoundary>
        <h2>Error</h2>
        <ErrorMessage>{error}</ErrorMessage>
        <Button onClick={() => setError(null)}>Retry</Button>
      </ErrorBoundary>
    );
  }

  if (isLoading) {
    return (
      <ErrorBoundary>
        <h2>Loading...</h2>
        <p>Please wait while we initialize the system</p>
      </ErrorBoundary>
    );
  }

  return (
    <DashboardContainer>
      <Sidebar>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            Attendance System
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time monitoring dashboard
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            startIcon={<Person />}
            variant="contained"
            color="secondary"
            fullWidth
          >
            Dashboard
          </Button>
          <Button
            startIcon={<Schedule />}
            variant="outlined"
            color="inherit"
            fullWidth
          >
            Schedule
          </Button>
          <Button
            startIcon={<BarChart />}
            variant="outlined"
            color="inherit"
            fullWidth
          >
            Reports
          </Button>
          <Button
            startIcon={<Settings />}
            variant="outlined"
            color="inherit"
            fullWidth
          >
            Settings
          </Button>
        </Box>
      </Sidebar>

      <MainContent>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            CCTV Monitoring Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton color="primary">
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton color="primary">
                <Notifications />
                <NotificationBadge>3</NotificationBadge>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <VideoContainer>
              <Video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                onError={(e) => setError('Error loading video stream')}
              />
              <Overlay>
                {detectedFaces.map((face, index) => (
                  <FaceBox
                    key={index}
                    recognized={face.recognized}
                    sx={{
                      left: `${face.x}px`,
                      top: `${face.y}px`,
                      width: `${face.width}px`,
                      height: `${face.height}px`
                    }}
                  >
                    {face.name || 'Unknown'}
                  </FaceBox>
                ))}
              </Overlay>
              <Controls>
                {!isMonitoring ? (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PlayArrow />}
                    onClick={startMonitoring}
                  >
                    Start Monitoring
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Stop />}
                    onClick={stopMonitoring}
                  >
                    Stop Monitoring
                  </Button>
                )}
              </Controls>
            </VideoContainer>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Current Class
              </Typography>
              {currentClass ? (
                <>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {currentClass.subject}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 1 }}>
                    {format(new Date(currentClass.startTime), 'HH:mm')} - {format(new Date(currentClass.endTime), 'HH:mm')}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 1 }}>
                    Room: {currentClass.room}
                  </Typography>
                  <Typography color="text.secondary">
                    Enrolled: {currentClass.enrolledStudents}
                  </Typography>
                </>
              ) : (
                <Typography color="text.secondary">
                  No class in progress
                </Typography>
              )}
            </Card>
          </Grid>
        </Grid>

        <StatsGrid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatLabel>Total Students</StatLabel>
              <StatValue>{attendanceStats.totalStudents}</StatValue>
            </StatCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatLabel>Present</StatLabel>
              <StatValue>{attendanceStats.present}</StatValue>
            </StatCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatLabel>Late</StatLabel>
              <StatValue>{attendanceStats.late}</StatValue>
            </StatCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatLabel>Absent</StatLabel>
              <StatValue>{attendanceStats.absent}</StatValue>
            </StatCard>
          </Grid>
        </StatsGrid>

        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Attendance Trends
              </Typography>
              <Line data={attendanceTrends} />
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Class Distribution
              </Typography>
              <Pie data={classDistribution} />
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Today's Schedule
          </Typography>
          <ScheduleList>
            {schedule.map((cls, index) => (
              <ScheduleItem
                key={index}
                active={currentClass?.id === cls.id}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {cls.subject}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(cls.startTime), 'HH:mm')} - {format(new Date(cls.endTime), 'HH:mm')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Room: {cls.room}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Students: {cls.enrolledStudents}
                  </Typography>
                </Box>
              </ScheduleItem>
            ))}
          </ScheduleList>
        </Card>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </MainContent>
    </DashboardContainer>
  );
};

export default CCTVMonitor; 