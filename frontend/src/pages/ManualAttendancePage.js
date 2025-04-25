import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
  Snackbar
} from '@mui/material';
import ManualAttendance from '../components/attendance/ManualAttendance';
import AttendanceAuditLog from '../components/attendance/AttendanceAuditLog';

const ManualAttendancePage = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [notification, setNotification] = useState(null);
  const [selectedAttendance, setSelectedAttendance] = useState({
    classId: null,
    date: null,
    sessionId: null
  });

  const handleAttendanceSaved = (data) => {
    setSelectedAttendance(data);
    setNotification({
      type: 'success',
      message: 'Attendance has been saved successfully!'
    });
    // Switch to audit log tab
    setCurrentTab(1);
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
        >
          <Tab label="Mark Attendance" />
          <Tab label="Audit Log" />
        </Tabs>
      </Box>

      {currentTab === 0 && (
        <ManualAttendance
          onAttendanceSaved={handleAttendanceSaved}
        />
      )}

      {currentTab === 1 && (
        <AttendanceAuditLog
          classId={selectedAttendance.classId}
          date={selectedAttendance.date}
          sessionId={selectedAttendance.sessionId}
        />
      )}

      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification?.type}
          variant="filled"
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ManualAttendancePage;
