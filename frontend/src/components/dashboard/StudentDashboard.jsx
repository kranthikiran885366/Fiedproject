import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Modal,
  TextField,
  CircularProgress,
  useTheme,
  alpha,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Camera as CameraIcon
} from '@mui/icons-material';
import attendanceService from '../../services/attendanceService';

const StudentDashboard = () => {
  const theme = useTheme();
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalClasses: 0,
    attendedClasses: 0,
    percentage: 0,
    pendingRequests: 0
  });
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessingAttendance, setIsProcessingAttendance] = useState(false);

  const fetchAttendanceData = async () => {
    try {
      const response = await attendanceService.getStudentAttendance();
      setAttendanceHistory(response.history);
      await fetchStats();
      setIsLoading(false);
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await attendanceService.getAttendanceStats();
      setStats(response);
    } catch (error) {
      toast.error('Failed to fetch attendance statistics');
    }
  };

  const handleMarkAttendance = async () => {
    setIsProcessingAttendance(true);
    try {
      await attendanceService.markAttendance();
      toast.success('Attendance marked successfully');
      await fetchAttendanceData();
    } catch (error) {
      toast.error('Failed to mark attendance');
    } finally {
      setIsProcessingAttendance(false);
      setIsCameraActive(false);
    }
  };

  const handleCorrectionRequest = async () => {
    if (!correctionReason.trim()) {
      toast.error('Please provide a reason for correction');
      return;
    }

    try {
      await attendanceService.submitCorrectionRequest({
        attendanceId: selectedAttendance._id,
        reason: correctionReason
      });
      toast.success('Correction request submitted successfully');
      setShowCorrectionModal(false);
      setCorrectionReason('');
      await fetchAttendanceData();
    } catch (error) {
      toast.error('Failed to submit correction request');
    }
  };

  const openCorrectionModal = (attendance) => {
    setSelectedAttendance(attendance);
    setShowCorrectionModal(true);
  };

  useEffect(() => {
    fetchAttendanceData();
    const interval = setInterval(fetchAttendanceData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchAttendanceData}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight="600">
          Student Dashboard
        </Typography>
        <Box>
          <Button
            variant="contained"
            color={isCameraActive ? 'error' : 'primary'}
            startIcon={<CameraIcon />}
            onClick={() => setIsCameraActive(!isCameraActive)}
            disabled={isProcessingAttendance}
            sx={{ mr: 2 }}
          >
            {isCameraActive ? 'Cancel' : 'Mark Attendance'}
          </Button>
          <IconButton onClick={fetchAttendanceData} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            <CardContent>
              <Typography variant="h6" color="primary.main">
                Total Classes
              </Typography>
              <Typography variant="h4" sx={{ mt: 2, fontWeight: 600 }}>
                {stats.totalClasses}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: alpha(theme.palette.success.main, 0.1),
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
            }}
          >
            <CardContent>
              <Typography variant="h6" color="success.main">
                Classes Attended
              </Typography>
              <Typography variant="h4" sx={{ mt: 2, fontWeight: 600 }}>
                {stats.attendedClasses}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: alpha(
                stats.percentage >= 75 ? theme.palette.success.main : theme.palette.warning.main,
                0.1
              ),
              border: `1px solid ${alpha(
                stats.percentage >= 75 ? theme.palette.success.main : theme.palette.warning.main,
                0.2
              )}`
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                color={stats.percentage >= 75 ? 'success.main' : 'warning.main'}
              >
                Attendance %
              </Typography>
              <Typography variant="h4" sx={{ mt: 2, fontWeight: 600 }}>
                {stats.percentage.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
            }}
          >
            <CardContent>
              <Typography variant="h6" color="warning.main">
                Pending Requests
              </Typography>
              <Typography variant="h4" sx={{ mt: 2, fontWeight: 600 }}>
                {stats.pendingRequests}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {isCameraActive && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ position: 'relative' }}>
              <video
                id="camera-feed"
                style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }}
                autoPlay
                playsInline
              />
              {isProcessingAttendance && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <CircularProgress color="primary" />
                </Box>
              )}
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleMarkAttendance}
                disabled={isProcessingAttendance}
              >
                Verify & Mark Attendance
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Attendance History
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: 16 }}>Date</th>
                  <th style={{ padding: 16 }}>Time</th>
                  <th style={{ padding: 16 }}>Status</th>
                  <th style={{ padding: 16 }}>Verification</th>
                  <th style={{ padding: 16 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.map((record) => (
                  <tr key={record._id} style={{ borderTop: `1px solid ${alpha('#000', 0.1)}` }}>
                    <td style={{ padding: 16 }}>
                      {new Date(record.timestamp).toLocaleDateString()}
                    </td>
                    <td style={{ padding: 16 }}>
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: 16 }}>
                      <Chip
                        icon={
                          record.status === 'present' ? (
                            <CheckCircleIcon />
                          ) : record.status === 'absent' ? (
                            <CancelIcon />
                          ) : (
                            <AccessTimeIcon />
                          )
                        }
                        label={record.status}
                        color={
                          record.status === 'present'
                            ? 'success'
                            : record.status === 'absent'
                            ? 'error'
                            : 'warning'
                        }
                        variant="outlined"
                      />
                    </td>
                    <td style={{ padding: 16 }}>{record.verificationMethod}</td>
                    <td style={{ padding: 16 }}>
                      <Tooltip title="Request Correction">
                        <IconButton
                          onClick={() => openCorrectionModal(record)}
                          disabled={record.correctionRequested}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </CardContent>
      </Card>

      <Modal
        open={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        aria-labelledby="correction-modal-title"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 400 },
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2
          }}
        >
          <Typography id="correction-modal-title" variant="h6" component="h2" gutterBottom>
            Request Attendance Correction
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            label="Reason for Correction"
            value={correctionReason}
            onChange={(e) => setCorrectionReason(e.target.value)}
            sx={{ mt: 2, mb: 3 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setShowCorrectionModal(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCorrectionRequest}>
              Submit Request
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default StudentDashboard;
