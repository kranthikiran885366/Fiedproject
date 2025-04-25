import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Refresh as RefreshIcon, History as HistoryIcon } from '@mui/icons-material';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalAttendance: 150,
    presentToday: 45,
    attendanceRate: 85,
    recentActivity: [
      { id: 1, student: 'John Doe', time: '9:00 AM', status: 'Present' },
      { id: 2, student: 'Jane Smith', time: '9:15 AM', status: 'Present' },
      { id: 3, student: 'Mike Johnson', time: '9:30 AM', status: 'Late' }
    ]
  });

  const fetchAttendanceStats = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setStats(prevStats => ({
        ...prevStats,
        presentToday: Math.floor(Math.random() * 50) + 30,
        attendanceRate: Math.floor(Math.random() * 20) + 75
      }));
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    fetchAttendanceStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchAttendanceStats}
              sx={{ mr: 2 }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => navigate('/attendance-report')}
              sx={{ mr: 2 }}
            >
              History
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/live-attendance')}
            >
              Mark Attendance
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Total Attendance
                </Typography>
                <Typography variant="h3">
                  {stats.totalAttendance}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Present Today
                </Typography>
                <Typography variant="h3">
                  {stats.presentToday}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Attendance Rate
                </Typography>
                <Typography variant="h3">
                  {stats.attendanceRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Recent Activity
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {stats.recentActivity.map((activity) => (
                    <Box
                      key={activity.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography>{activity.student}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography color="text.secondary">{activity.time}</Typography>
                        <Typography
                          color={activity.status === 'Present' ? 'success.main' : 'warning.main'}
                        >
                          {activity.status}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard;
