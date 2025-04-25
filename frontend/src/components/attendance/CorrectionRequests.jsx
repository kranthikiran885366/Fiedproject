import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  IconButton,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  AccessTime as PendingIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import attendanceService from '../../services/attendanceService';

const CorrectionRequests = () => {
  const theme = useTheme();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseDialog, setResponseDialog] = useState(false);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
    // Poll for new requests every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await attendanceService.getCorrectionRequests();
      setRequests(data);
    } catch (error) {
      toast.error('Failed to fetch correction requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await attendanceService.respondToCorrectionRequest(requestId, {
        status: 'approved',
        response
      });
      toast.success('Request approved successfully');
      setResponseDialog(false);
      setResponse('');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await attendanceService.respondToCorrectionRequest(requestId, {
        status: 'rejected',
        response
      });
      toast.success('Request rejected successfully');
      setResponseDialog(false);
      setResponse('');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return theme.palette.warning.main;
      case 'approved':
        return theme.palette.success.main;
      case 'rejected':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom fontWeight="600">
        Attendance Correction Requests
      </Typography>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Loading requests...</Typography>
        </Box>
      ) : requests.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>No correction requests found</Typography>
        </Box>
      ) : (
        <List sx={{ mt: 2 }}>
          {requests.map((request) => (
            <Card
              key={request._id}
              sx={{
                mb: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                '&:hover': {
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      {request.studentName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {request.courseCode} - {request.courseName}
                    </Typography>
                  </Box>
                  <Chip
                    icon={
                      request.status === 'pending' ? (
                        <PendingIcon />
                      ) : request.status === 'approved' ? (
                        <CheckIcon />
                      ) : (
                        <CloseIcon />
                      )
                    }
                    label={request.status.toUpperCase()}
                    sx={{
                      bgcolor: alpha(getStatusColor(request.status), 0.1),
                      color: getStatusColor(request.status),
                      fontWeight: 600
                    }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Original Date: {new Date(request.originalDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Reason: {request.reason}
                  </Typography>
                </Box>

                {request.status === 'pending' && (
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      startIcon={<CloseIcon />}
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        setSelectedRequest(request);
                        setResponseDialog(true);
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      startIcon={<CheckIcon />}
                      variant="contained"
                      color="success"
                      onClick={() => {
                        setSelectedRequest(request);
                        setResponseDialog(true);
                      }}
                    >
                      Approve
                    </Button>
                  </Box>
                )}

                {request.response && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.info.main, 0.1)
                    }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      Response: {request.response}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </List>
      )}

      <Dialog open={responseDialog} onClose={() => setResponseDialog(false)}>
        <DialogTitle>
          {selectedRequest?.status === 'approved' ? 'Approve' : 'Reject'} Request
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Response Message"
            fullWidth
            multiline
            rows={4}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialog(false)}>Cancel</Button>
          <Button
            onClick={() =>
              selectedRequest?.status === 'approved'
                ? handleApprove(selectedRequest?._id)
                : handleReject(selectedRequest?._id)
            }
            color={selectedRequest?.status === 'approved' ? 'success' : 'error'}
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CorrectionRequests;
