import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';

const AttendanceReport = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState({
    date: new Date().toISOString().split('T')[0],
    department: 'CSE',
    class: 'A',
    totalStudents: 60,
    present: 45,
    absent: 15,
    students: [
      { id: 1, name: 'John Doe', status: 'present', time: '09:15 AM' },
      { id: 2, name: 'Jane Smith', status: 'absent', time: '-' },
      { id: 3, name: 'Mike Johnson', status: 'present', time: '09:20 AM' },
      // Add more sample data
    ],
  });
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  const generateReport = async () => {
    setLoading(true);
    try {
      // Simulate API call to generate report
      await new Promise(resolve => setTimeout(resolve, 1000));
      enqueueSnackbar('Report generated successfully!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error generating report', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const sendNotifications = async () => {
    setLoading(true);
    try {
      // Simulate sending notifications
      await new Promise(resolve => setTimeout(resolve, 1000));
      enqueueSnackbar('Notifications sent successfully!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error sending notifications', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    // Simulate downloading report
    enqueueSnackbar('Report downloaded successfully!', { variant: 'success' });
  };

  const printReport = () => {
    window.print();
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Attendance Report
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Summary
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1">
                    Date: {new Date(report.date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body1">
                    Department: {report.department}
                  </Typography>
                  <Typography variant="body1">
                    Class: {report.class}
                  </Typography>
                  <Typography variant="body1">
                    Total Students: {report.totalStudents}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={`Present: ${report.present}`}
                      color="success"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`Absent: ${report.absent}`}
                      color="error"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Student List
                  </Typography>
                  <Box>
                    <Tooltip title="Download Report">
                      <IconButton onClick={downloadReport}>
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print Report">
                      <IconButton onClick={printReport}>
                        <PrintIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Send Notifications">
                      <IconButton onClick={sendNotifications} disabled={loading}>
                        <EmailIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Roll No.</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.id}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={student.status}
                              color={student.status === 'present' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{student.time}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Generate Report'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<WhatsAppIcon />}
            onClick={sendNotifications}
            disabled={loading}
          >
            Send Notifications
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AttendanceReport; 