import React from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  Grid,
  CircularProgress,
  useTheme
} from '@mui/material';
import { styled } from '@mui/system';
import {
  Timeline,
  Group,
  CheckCircle,
  Warning,
  TrendingUp
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const StatsCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
}));

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 500,
  color: theme.palette.primary.main,
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1)
}));

const IconWrapper = styled(Box)(({ theme, color }) => ({
  backgroundColor: color || theme.palette.primary.main,
  borderRadius: '50%',
  padding: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  '& svg': {
    color: theme.palette.common.white
  }
}));

const StatCard = ({ title, value, icon, color, trend }) => {
  return (
    <StatsCard>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="subtitle2" color="textSecondary">
            {title}
          </Typography>
          <StatValue>{value}</StatValue>
          {trend && (
            <Typography variant="caption" color={trend.color} sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp fontSize="small" sx={{ mr: 0.5 }} />
              {trend.value}
            </Typography>
          )}
        </Box>
        <IconWrapper color={color}>
          {icon}
        </IconWrapper>
      </Box>
    </StatsCard>
  );
};

const AttendanceStats = ({ data, loading = false }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  const { 
    totalStudents = 0,
    presentToday = 0,
    averageAttendance = 0,
    attendanceHistory = []
  } = data || {};

  const attendanceRate = ((presentToday / totalStudents) * 100).toFixed(1);

  const stats = [
    {
      title: 'Total Students',
      value: totalStudents,
      icon: <Group />,
      color: theme.palette.primary.main,
      trend: { value: '+5% this month', color: 'success.main' }
    },
    {
      title: 'Present Today',
      value: presentToday,
      icon: <CheckCircle />,
      color: theme.palette.success.main,
      trend: { value: `${attendanceRate}% Rate`, color: 'success.main' }
    },
    {
      title: 'Average Attendance',
      value: `${averageAttendance}%`,
      icon: <Timeline />,
      color: theme.palette.info.main
    },
    {
      title: 'Attention Required',
      value: totalStudents - presentToday,
      icon: <Warning />,
      color: theme.palette.warning.main
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Attendance Chart */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Attendance Trend
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart
              data={attendanceHistory}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="attendance"
                fill={theme.palette.primary.main}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Card>
    </Box>
  );
};

export default AttendanceStats;
