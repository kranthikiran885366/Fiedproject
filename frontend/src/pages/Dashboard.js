import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Container,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh,
  TrendingUp,
  Person,
  AccessTime,
  LocationOn
} from '@mui/icons-material';
import { useQuery } from 'react-query';

import AttendanceStats from '../components/Dashboard/AttendanceStats';
import BehaviorDisplay from '../components/BehaviorAnalysis/BehaviorDisplay';
import EmotionDisplay from '../components/EmotionAnalysis/EmotionDisplay';
import { analyticsAPI } from '../services/api';

const StatCard = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          p: 1, 
          borderRadius: 1, 
          bgcolor: `${color}.light`,
          color: `${color}.main`,
          mr: 2 
        }}>
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ mb: 1 }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { data: stats, refetch: refetchStats } = useQuery(
    'attendanceStats',
    () => analyticsAPI.getAttendanceAnalytics()
  );

  const { data: emotionData } = useQuery(
    'emotionStats',
    () => analyticsAPI.getEmotionAnalytics()
  );

  const { data: behaviorData } = useQuery(
    'behaviorStats',
    () => analyticsAPI.getBehaviorAnalytics()
  );

  const handleRefresh = () => {
    refetchStats();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton onClick={handleRefresh}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sessions"
            value={stats?.totalSessions || 0}
            icon={<AccessTime />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Present Today"
            value={stats?.presentToday || 0}
            icon={<Person />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Attendance Rate"
            value={`${stats?.attendanceRate || 0}%`}
            icon={<TrendingUp />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Locations"
            value={stats?.activeLocations || 0}
            icon={<LocationOn />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Charts and Analysis */}
      <Grid container spacing={3}>
        {/* Attendance Trends */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <AttendanceStats data={stats?.trends} />
          </Paper>
        </Grid>

        {/* Emotion Analysis */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <EmotionDisplay emotionData={emotionData} />
          </Paper>
        </Grid>

        {/* Behavior Analysis */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <BehaviorDisplay data={behaviorData} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
