import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  useTheme,
  alpha
} from '@mui/material';
import {
  Videocam as VideocamIcon,
  Assessment as AssessmentIcon,
  Edit as EditIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import CCTVStream from '../monitoring/CCTVStream';
import AttendanceAnalytics from '../analytics/AttendanceAnalytics';
import CorrectionRequests from '../attendance/CorrectionRequests';
import attendanceService from '../../services/attendanceService';

const FacultyDashboard = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [showCCTV, setShowCCTV] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await attendanceService.getFacultyClasses();
      setClasses(response.classes);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch classes');
    }
  };

  const handleClassSelect = async (classId) => {
    try {
      setLoading(true);
      const response = await attendanceService.getClassAttendance(classId);
      setSelectedClass(classId);
      setAttendanceData(response.attendance);
    } catch (error) {
      toast.error('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const startAttendanceSession = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }

    try {
      await attendanceService.startAttendanceSession(selectedClass);
      toast.success('Attendance session started');
      setShowCCTV(true);
    } catch (error) {
      toast.error('Failed to start attendance session');
    }
  };

  const endAttendanceSession = async () => {
    try {
      await attendanceService.endAttendanceSession(selectedClass);
      toast.success('Attendance session ended');
      setShowCCTV(false);
      // Refresh attendance data
      handleClassSelect(selectedClass);
    } catch (error) {
      toast.error('Failed to end attendance session');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight="600">
          Faculty Dashboard
        </Typography>
        <Box sx={{ minWidth: 200 }}>
          <select
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              outline: 'none'
            }}
            onChange={(e) => handleClassSelect(e.target.value)}
            value={selectedClass || ''}
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name} - {cls.subject}
              </option>
            ))}
          </select>
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
                Total Students
              </Typography>
              <Typography variant="h4" sx={{ mt: 2, fontWeight: 600 }}>
                {selectedClass ? classes.find(c => c._id === selectedClass)?.totalStudents || 0 : 0}
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
                Present Today
              </Typography>
              <Typography variant="h4" sx={{ mt: 2, fontWeight: 600 }}>
                {attendanceData.filter(a => a.status === 'present').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: alpha(theme.palette.error.main, 0.1),
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
            }}
          >
            <CardContent>
              <Typography variant="h6" color="error.main">
                Absent Today
              </Typography>
              <Typography variant="h4" sx={{ mt: 2, fontWeight: 600 }}>
                {attendanceData.filter(a => a.status === 'absent').length}
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
                {attendanceData.filter(a => a.status === 'pending').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: 2
          }}
        >
          <Tab
            icon={<VideocamIcon />}
            label="Live Monitoring"
            iconPosition="start"
          />
          <Tab
            icon={<AssessmentIcon />}
            label="Analytics"
            iconPosition="start"
          />
          <Tab
            icon={<EditIcon />}
            label="Correction Requests"
            iconPosition="start"
          />
        </Tabs>

        {selectedClass && activeTab === 0 && (
          <Box>
            <Button
              variant="contained"
              color={showCCTV ? 'error' : 'primary'}
              onClick={showCCTV ? endAttendanceSession : startAttendanceSession}
              startIcon={<VideocamIcon />}
            >
              {showCCTV ? 'End Attendance Session' : 'Start Attendance Session'}
            </Button>
          </Box>
        )}
      </Box>

      {/* Tab Panels */}
      {activeTab === 0 && (
        <Box>
          {showCCTV && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <CCTVStream classId={selectedClass} />
              </CardContent>
            </Card>
          )}

          {selectedClass && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Today's Attendance
                </Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: 16 }}>Student Name</th>
                        <th style={{ padding: 16 }}>Roll Number</th>
                        <th style={{ padding: 16 }}>Time</th>
                        <th style={{ padding: 16 }}>Status</th>
                        <th style={{ padding: 16 }}>Verification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.map((record) => (
                        <tr key={record._id} style={{ borderTop: `1px solid ${alpha('#000', 0.1)}` }}>
                          <td style={{ padding: 16 }}>{record.studentName}</td>
                          <td style={{ padding: 16 }}>{record.rollNumber}</td>
                          <td style={{ padding: 16 }}>
                            {new Date(record.timestamp).toLocaleTimeString()}
                          </td>
                          <td style={{ padding: 16 }}>
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: alpha(
                                  record.status === 'present'
                                    ? theme.palette.success.main
                                    : record.status === 'absent'
                                    ? theme.palette.error.main
                                    : theme.palette.warning.main,
                                  0.1
                                ),
                                color:
                                  record.status === 'present'
                                    ? theme.palette.success.main
                                    : record.status === 'absent'
                                    ? theme.palette.error.main
                                    : theme.palette.warning.main,
                                fontWeight: 600
                              }}
                            >
                              {record.status}
                            </Box>
                          </td>
                          <td style={{ padding: 16 }}>{record.verificationMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {activeTab === 1 && selectedClass && (
        <Card>
          <CardContent>
            <AttendanceAnalytics
              classId={selectedClass}
              attendanceData={attendanceData}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && selectedClass && (
        <CorrectionRequests classId={selectedClass} />
      )}
    </div>
  );
};

export default FacultyDashboard;
