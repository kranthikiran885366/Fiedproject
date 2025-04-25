import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs
} from '@mui/material';
import {
  Group,
  School,
  Assessment,
  Event,
  MoreVert,
  Download,
  Mail,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useQuery, useMutation } from 'react-query';
import { useAuth } from '../hooks/useAuth';
import { facultyAPI } from '../services/api';
import CorrectionRequests from '../components/faculty/CorrectionRequests';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import BehaviorDisplay from '../components/BehaviorAnalysis/BehaviorDisplay';
import EmotionDisplay from '../components/EmotionAnalysis/EmotionDisplay';

const FacultyDashboard = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const { user } = useAuth();

  const { data: facultyData } = useQuery(
    ['facultyData', user.id],
    () => facultyAPI.getFacultyData(user.id)
  );

  const { data: correctionRequests } = useQuery(
    ['correctionRequests'],
    () => facultyAPI.getCorrectionRequests(),
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  const { data: courseStats } = useQuery(
    ['courseStats', selectedCourse?.id],
    () => selectedCourse && facultyAPI.getCourseStats(selectedCourse.id),
    { enabled: !!selectedCourse }
  );

  const handleMenuOpen = (event, course) => {
    setSelectedCourse(course);
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleExportAttendance = () => {
    // Implementation for exporting attendance
    handleMenuClose();
  };

  const handleEmailStudents = () => {
    setOpenDialog(true);
    handleMenuClose();
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Faculty Profile */}
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
              {facultyData?.department} - {facultyData?.designation}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Chip icon={<School />} label={`${facultyData?.totalCourses} Courses`} />
              <Chip icon={<Group />} label={`${facultyData?.totalStudents} Students`} />
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
                <Group color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Students</Typography>
              </Box>
              <Typography variant="h4">
                {facultyData?.totalStudents || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <School color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Courses</Typography>
              </Box>
              <Typography variant="h4">
                {facultyData?.activeCourses || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Avg. Attendance</Typography>
              </Box>
              <Typography variant="h4">
                {facultyData?.averageAttendance || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Low Attendance</Typography>
              </Box>
              <Typography variant="h4">
                {facultyData?.lowAttendanceCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Course Overview */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
            <Tab label="Course Overview" />
            <Tab label="Attendance Analytics" />
            <Tab label="Behavior Analysis" />
          </Tabs>
        </Box>

        {/* Course Overview Tab */}
        {currentTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Course</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Students</TableCell>
                  <TableCell>Attendance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {facultyData?.courses?.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{course.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {course.code}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Event sx={{ mr: 1 }} fontSize="small" />
                        {course.schedule}
                      </Box>
                    </TableCell>
                    <TableCell>{course.enrolledStudents}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {course.attendanceRate >= 75 ? (
                          <CheckCircle color="success" sx={{ mr: 1 }} fontSize="small" />
                        ) : (
                          <Warning color="warning" sx={{ mr: 1 }} fontSize="small" />
                        )}
                        {course.attendanceRate}%
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={course.status}
                        color={course.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={(e) => handleMenuOpen(e, course)}>
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Attendance Analytics Tab */}
        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Attendance Distribution
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={courseStats?.attendanceDistribution || []}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            {courseStats?.attendanceDistribution.map((entry, index) => (
                              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <EmotionDisplay emotionData={courseStats?.emotionAnalysis} />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Behavior Analysis Tab */}
        {currentTab === 2 && (
          <Box sx={{ p: 3 }}>
            <BehaviorDisplay data={courseStats?.behaviorAnalysis} />
          </Box>
        )}
      </Paper>

      {/* Correction Requests Section */}
      <Box sx={{ mt: 4, mb: 4 }}>
        <CorrectionRequests requests={correctionRequests} />
      </Box>

      {/* Course Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleExportAttendance}>
          <Download sx={{ mr: 1 }} /> Export Attendance
        </MenuItem>
        <MenuItem onClick={handleEmailStudents}>
          <Mail sx={{ mr: 1 }} /> Email Students
        </MenuItem>
      </Menu>

      {/* Email Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Email Students</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Subject"
            margin="normal"
          />
          <TextField
            fullWidth
            label="Message"
            multiline
            rows={4}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setOpenDialog(false)}>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FacultyDashboard;
