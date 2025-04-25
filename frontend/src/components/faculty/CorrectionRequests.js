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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Info,
  Person,
  AccessTime,
  School
} from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { facultyAPI } from '../../services/api';

const CorrectionRequests = ({ requests }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [response, setResponse] = useState('');
  const queryClient = useQueryClient();

  const handleMutation = useMutation(
    (data) => facultyAPI.handleCorrectionRequest(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('correctionRequests');
        handleCloseDialog();
      }
    }
  );

  const handleOpenDialog = (request) => {
    setSelectedRequest(request);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRequest(null);
    setResponse('');
  };

  const handleAction = async (action) => {
    await handleMutation.mutateAsync({
      requestId: selectedRequest.id,
      action,
      response,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Attendance Correction Requests
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Original Date</TableCell>
                <TableCell>Request Date</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={request.student.photoURL}
                        alt={request.student.name}
                        sx={{ width: 32, height: 32 }}
                      >
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="body2">
                          {request.student.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ID: {request.student.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <School fontSize="small" />
                      <Box>
                        <Typography variant="body2">
                          {request.course.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {request.course.code}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime fontSize="small" />
                      <Box>
                        <Typography variant="body2">
                          {new Date(request.originalDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(request.originalDate).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(request.requestDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={request.reason}>
                      <IconButton size="small">
                        <Info fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenDialog(request)}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Review Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Review Correction Request</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 3, mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Student: {selectedRequest?.student.name}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Course: {selectedRequest?.course.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Original Date: {selectedRequest?.originalDate && 
                  new Date(selectedRequest.originalDate).toLocaleString()}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Student's Reason:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2">
                  {selectedRequest?.reason}
                </Typography>
              </Paper>
              <TextField
                fullWidth
                label="Your Response"
                multiline
                rows={4}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                required
                placeholder="Provide a reason for your decision..."
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={() => handleAction('reject')}
              disabled={!response.trim() || handleMutation.isLoading}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => handleAction('approve')}
              disabled={!response.trim() || handleMutation.isLoading}
            >
              Approve
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CorrectionRequests;
