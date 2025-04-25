import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Avatar,
  Paper,
  Chip
} from '@mui/material';
import {
  School,
  AccessTime,
  Assignment,
  CheckCircle,
  Warning,
  TrendingUp,
  Event,
  LocationOn
} from '@mui/icons-material';
import { useQuery, useMutation } from 'react-query';
import { useAuth } from '../hooks/useAuth';
import { studentAPI } from '../services/api';
import AttendanceHistory from '../components/attendance/AttendanceHistory';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StudentDashboard = () => {
  const { user } = useAuth();
  
  const { data: studentData } = useQuery(
    ['studentData', user.id],
    () => studentAPI.getStudentData(user.id)
  );

  const { data: attendanceData } = useQuery(
    ['attendanceData', user.id],
    () => studentAPI.getAttendanceData(user.id)
  );

  const { data: upcomingClasses } = useQuery(
    ['upcomingClasses', user.id],
    () => studentAPI.getUpcomingClasses(user.id)
  );

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 75) return { color: 'success', text: 'Good Standing' };
    if (percentage >= 60) return { color: 'warning', text: 'Warning' };
    return { color: 'error', text: 'Critical' };
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Student Profile Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              src={user.photoURL}
              alt={user.name}
              sx={{ width: 100, height: 100 }}
            />
          </Grid>
          <Grid item xs>
            <Typography variant="h4">{user.name}</Typography>
            <Typography color="textSecondary" gutterBottom>
              Student ID: {studentData?.studentId}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Chip icon={<School />} label={studentData?.department} />
              <Chip icon={<Event />} label={`Semester ${studentData?.semester}`} />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Attendance Rate</Typography>
              </Box>
              <Typography variant="h4">
                {attendanceData?.overallAttendance || 0}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={attendanceData?.overallAttendance || 0}
                color={getAttendanceStatus(attendanceData?.overallAttendance).color}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assignment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Courses</Typography>
              </Box>
              <Typography variant="h4">
                {studentData?.totalCourses || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Attendance Warnings</Typography>
              </Box>
              <Typography variant="h4">
                {attendanceData?.warnings || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Current Streak</Typography>
              </Box>
              <Typography variant="h4">
                {attendanceData?.currentStreak || 0} days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Attendance Chart */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Attendance Trends
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={attendanceData?.trends || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#1a237e"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Schedule
              </Typography>
              <List>
                {upcomingClasses?.map((class_, index) => (
                  <React.Fragment key={class_.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemIcon>
                        <AccessTime color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={class_.courseName}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {class_.time}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <LocationOn fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2" color="textSecondary">
                                {class_.location}
                              </Typography>
                            </Box>
                          </>
                        }
                      />
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!class_.canMarkAttendance}
                      >
                        Mark Attendance
                      </Button>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Course Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Course Attendance Status
              </Typography>
              <List>
                {studentData?.courses?.map((course, index) => (
                  <React.Fragment key={course.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={course.name}
                        secondary={`${course.attendedClasses}/${course.totalClasses} classes`}
                      />
                      <Box sx={{ minWidth: 100 }}>
                        <Typography variant="body2" color="textSecondary" align="right">
                          {course.attendancePercentage}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={course.attendancePercentage}
                          color={getAttendanceStatus(course.attendancePercentage).color}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Attendance History Section */}
      <Box sx={{ mt: 4 }}>
        <AttendanceHistory attendanceData={attendanceData?.history} />
      </Box>
    </Container>
  );
};

export default StudentDashboard;
