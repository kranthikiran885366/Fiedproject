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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Paper
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  History,
  Edit,
  LocationOn,
  AccessTime
} from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { attendanceAPI } from '../../services/api';

const AttendanceHistory = ({ attendanceData }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const queryClient = useQueryClient();

  const correctionMutation = useMutation(
    (data) => attendanceAPI.requestCorrection(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('attendanceHistory');
        handleCloseDialog();
      }
    }
  );

  const handleRequestCorrection = (record) => {
    setSelectedRecord(record);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRecord(null);
    setCorrectionReason('');
  };

  const handleSubmitCorrection = async () => {
    await correctionMutation.mutateAsync({
      attendanceId: selectedRecord.id,
      reason: correctionReason,
      timestamp: new Date().toISOString()
    });
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'present':
        return <Chip icon={<CheckCircle />} label="Present" color="success" size="small" />;
      case 'absent':
        return <Chip icon={<Cancel />} label="Absent" color="error" size="small" />;
      case 'pending':
        return <Chip icon={<History />} label="Correction Pending" color="warning" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Attendance History
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Verification Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceData?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTime fontSize="small" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="body2">
                          {new Date(record.timestamp).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{record.courseName}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {record.courseCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOn fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">{record.location}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={record.verificationMethod}
                      size="small"
                      color={
                        record.verificationMethod === 'Face Recognition' ? 'primary' :
                        record.verificationMethod === 'QR Code' ? 'secondary' :
                        'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {getStatusChip(record.status)}
                  </TableCell>
                  <TableCell>
                    {record.status !== 'pending' && (
                      <IconButton
                        size="small"
                        onClick={() => handleRequestCorrection(record)}
                        title="Request Correction"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Correction Request Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Request Attendance Correction</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2, mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Course: {selectedRecord?.courseName}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Date: {selectedRecord?.timestamp && new Date(selectedRecord.timestamp).toLocaleDateString()}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Current Status: {selectedRecord?.status}
              </Typography>
            </Box>
            <TextField
              fullWidth
              label="Reason for Correction"
              multiline
              rows={4}
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              required
              placeholder="Please provide a detailed reason for the attendance correction request..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmitCorrection}
              disabled={!correctionReason.trim() || correctionMutation.isLoading}
            >
              Submit Request
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AttendanceHistory;
