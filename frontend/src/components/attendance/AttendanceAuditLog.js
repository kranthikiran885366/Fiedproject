import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Info,
  Person,
  AccessTime,
  Edit,
  CheckCircle,
  Cancel,
  AutoMode
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { attendanceAPI } from '../../services/api';

const AttendanceAuditLog = ({ classId, date, sessionId }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const { data: auditLogs } = useQuery(
    ['auditLogs', classId, date, sessionId],
    () => attendanceAPI.getAttendanceAuditLogs(classId, date, sessionId),
    { enabled: !!(classId && date && sessionId) }
  );

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setOpenDialog(true);
  };

  const getMethodChip = (method) => {
    switch (method) {
      case 'face_recognition':
        return (
          <Chip
            icon={<AutoMode />}
            label="Face Recognition"
            color="primary"
            size="small"
          />
        );
      case 'manual':
        return (
          <Chip
            icon={<Edit />}
            label="Manual"
            color="secondary"
            size="small"
          />
        );
      case 'gps':
        return (
          <Chip
            icon={<AutoMode />}
            label="GPS"
            color="info"
            size="small"
          />
        );
      default:
        return (
          <Chip
            label={method}
            size="small"
          />
        );
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'present':
        return (
          <Chip
            icon={<CheckCircle />}
            label="Present"
            color="success"
            size="small"
          />
        );
      case 'absent':
        return (
          <Chip
            icon={<Cancel />}
            label="Absent"
            color="error"
            size="small"
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Attendance Audit Log
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Modified By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={log.student.photoUrl} alt={log.student.name}>
                        {log.student.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">
                          {log.student.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {log.student.rollNo}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime fontSize="small" />
                      <Box>
                        <Typography variant="body2">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {format(new Date(log.timestamp), 'HH:mm:ss')}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getMethodChip(log.method)}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(log.status)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" />
                      <Typography variant="body2">
                        {log.modifiedBy}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(log)}
                      >
                        <Info />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Details Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Attendance Modification Details
          </DialogTitle>
          <DialogContent>
            {selectedLog && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Student: {selectedLog.student.name}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Roll No: {selectedLog.student.rollNo}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Time: {format(new Date(selectedLog.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Method: {selectedLog.method}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Status: {selectedLog.status}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Modified By: {selectedLog.modifiedBy}
                </Typography>
                {selectedLog.reason && (
                  <>
                    <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
                      Modification Reason:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2">
                        {selectedLog.reason}
                      </Typography>
                    </Paper>
                  </>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AttendanceAuditLog;
