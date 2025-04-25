import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import { useAttendance } from '../../contexts/AttendanceContext';

const Attendance = () => {
  const { 
    currentSession,
    markAttendance,
    startAttendanceSession,
    endAttendanceSession,
    loading,
    error
  } = useAttendance();
  const [attendanceData, setAttendanceData] = useState([]);

  useEffect(() => {
    if (currentSession) {
      // Fetch attendance data for current session
      const fetchData = async () => {
        try {
          // TODO: Replace with actual API call
          const mockData = [
            {
              id: 1,
              studentId: 'S001',
              name: 'John Doe',
              status: 'Present',
              timestamp: new Date().toISOString()
            }
          ];
          setAttendanceData(mockData);
        } catch (err) {
          console.error('Error fetching attendance data:', err);
        }
      };
      fetchData();
    }
  }, [currentSession]);

  const handleStartSession = async () => {
    try {
      await startAttendanceSession();
    } catch (err) {
      console.error('Error starting session:', err);
    }
  };

  const handleEndSession = async () => {
    try {
      await endAttendanceSession();
    } catch (err) {
      console.error('Error ending session:', err);
    }
  };

  const handleMarkAttendance = async (studentId, status) => {
    try {
      await markAttendance(currentSession.id, { studentId, status });
    } catch (err) {
      console.error('Error marking attendance:', err);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          Attendance Management
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={2}>
              <Box p={3}>
                <Box display="flex" justifyContent="space-between" mb={3}>
                  <Typography variant="h6">Today's Classes</Typography>
                  {currentSession ? (
                    <Button 
                      variant="contained" 
                      color="error"
                      onClick={handleEndSession}
                    >
                      End Session
                    </Button>
                  ) : (
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={handleStartSession}
                    >
                      Start Session
                    </Button>
                  )}
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : (
                        attendanceData.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.studentId}</TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.status}</TableCell>
                            <TableCell>{new Date(row.timestamp).toLocaleTimeString()}</TableCell>
                            <TableCell>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleMarkAttendance(row.studentId, 'Present')}
                                disabled={row.status === 'Present'}
                              >
                                Mark Present
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                sx={{ ml: 1 }}
                                onClick={() => handleMarkAttendance(row.studentId, 'Absent')}
                                disabled={row.status === 'Absent'}
                              >
                                Mark Absent
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      {!loading && attendanceData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No attendance records found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Attendance;
