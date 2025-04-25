import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
import axios from 'axios';

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [attendanceData, setAttendanceData] = useState({
    daily: [],
    weekly: [],
    monthly: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/analytics?range=${timeRange}`);
      setAttendanceData(response.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    const labels = attendanceData[timeRange].map(item => 
      format(new Date(item.date), timeRange === 'daily' ? 'HH:mm' : 'MMM dd')
    );
    
    return {
      labels,
      datasets: [
        {
          label: 'Present',
          data: attendanceData[timeRange].map(item => item.present),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        {
          label: 'Absent',
          data: attendanceData[timeRange].map(item => item.absent),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
        {
          label: 'Late',
          data: attendanceData[timeRange].map(item => item.late),
          borderColor: 'rgb(255, 205, 86)',
          backgroundColor: 'rgba(255, 205, 86, 0.5)',
        }
      ]
    };
  };

  const getAttendanceStats = () => {
    const total = attendanceData[timeRange].reduce((acc, curr) => 
      acc + curr.present + curr.absent + curr.late, 0
    );
    const present = attendanceData[timeRange].reduce((acc, curr) => acc + curr.present, 0);
    const absent = attendanceData[timeRange].reduce((acc, curr) => acc + curr.absent, 0);
    const late = attendanceData[timeRange].reduce((acc, curr) => acc + curr.late, 0);

    return {
      total,
      present,
      absent,
      late,
      attendanceRate: total ? ((present / total) * 100).toFixed(1) : 0
    };
  };

  const stats = getAttendanceStats();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Attendance
              </Typography>
              <Typography variant="h4">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Present
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.present}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Absent
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.absent}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Late Arrivals
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.late}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Trend
            </Typography>
            <Line 
              data={getChartData()}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Attendance Over Time'
                  }
                }
              }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Distribution
            </Typography>
            <Pie
              data={{
                labels: ['Present', 'Absent', 'Late'],
                datasets: [{
                  data: [stats.present, stats.absent, stats.late],
                  backgroundColor: [
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(255, 205, 86, 0.5)'
                  ]
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  }
                }
              }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Rate
            </Typography>
            <Typography variant="h2" align="center" color="primary">
              {stats.attendanceRate}%
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard; 