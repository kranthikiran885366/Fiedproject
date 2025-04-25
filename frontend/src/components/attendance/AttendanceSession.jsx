import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  QrCode as QrIcon,
  Face as FaceIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import blockchainService from '../../services/blockchain.service';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import FaceRecognition from './FaceRecognition';

const AttendanceSession = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('inactive');
  const [attendees, setAttendees] = useState([]);
  const [showBlockchainError, setShowBlockchainError] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Poll for session status and attendees
  useEffect(() => {
    let pollInterval;
    
    const pollSessionStatus = async () => {
      try {
        if (sessionId) {
          const activeSession = await blockchainService.getActiveSession(user.id);
          if (activeSession) {
            setSessionStatus('active');
            // Get attendees
            const currentAttendees = await blockchainService.getAttendance(sessionId);
            setAttendees(currentAttendees);
          } else {
            setSessionStatus('inactive');
            setSessionId(null);
          }
        }
      } catch (error) {
        console.error('Session polling error:', error);
      }
    };

    if (sessionId) {
      pollInterval = setInterval(pollSessionStatus, 10000); // Poll every 10 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [sessionId, user.id]);

  // Initialize blockchain on component mount
  useEffect(() => {
    const initBlockchain = async () => {
      try {
        await blockchainService.initialize();
      } catch (error) {
        console.error('Blockchain initialization error:', error);
        setShowBlockchainError(true);
      }
    };

    initBlockchain();
  }, []);

  const checkActiveSession = async () => {
    try {
      setLoading(true);
      const activeSession = await blockchainService.getActiveSession(user.id);
      if (activeSession) {
        setSessionId(activeSession.id);
        setSessionStatus('active');
        const currentAttendees = await blockchainService.getAttendance(activeSession.id);
        setAttendees(currentAttendees);
      }
    } catch (error) {
      console.error('Failed to check active session:', error);
      addNotification({
        type: 'error',
        message: 'Failed to check active session',
        important: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialize blockchain if not already initialized
      if (!blockchainService.initialized) {
        await blockchainService.initialize();
      }
      
      // Generate a unique session ID
      const newSessionId = `${user.id}-${Date.now()}`;
      
      // Create session on blockchain
      await blockchainService.createSession(newSessionId, user.id);
      
      setSessionId(newSessionId);
      setSessionStatus('active');
      
      addNotification({
        type: 'success',
        message: 'Attendance session started successfully',
        important: true
      });
    } catch (error) {
      console.error('Failed to start session:', error);
      setError(error.message);
      addNotification({
        type: 'error',
        message: 'Failed to start attendance session',
        important: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    try {
      setLoading(true);
      setError(null);

      await blockchainService.endSession(sessionId);
      
      setSessionId(null);
      setSessionStatus('inactive');
      setAttendees([]);
      
      addNotification({
        type: 'success',
        message: 'Attendance session ended successfully',
        important: true
      });
    } catch (error) {
      console.error('Failed to end session:', error);
      setError(error.message);
      addNotification({
        type: 'error',
        message: 'Failed to end attendance session',
        important: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceMarked = async (studentId) => {
    try {
      const verified = await blockchainService.verifyAttendance(sessionId, studentId);
      if (verified) {
        const updatedAttendees = await blockchainService.getAttendance(sessionId);
        setAttendees(updatedAttendees);
      }
    } catch (error) {
      console.error('Failed to verify attendance:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Dialog
        open={showBlockchainError}
        onClose={() => setShowBlockchainError(false)}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Blockchain Connection Error
        </DialogTitle>
        <DialogContent>
          <Typography>
            Failed to connect to the blockchain network. Please make sure:
            <ul>
              <li>MetaMask is installed and unlocked</li>
              <li>You are connected to the correct network</li>
              <li>Your wallet has sufficient funds for gas fees</li>
            </ul>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBlockchainError(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                await blockchainService.initialize();
                setShowBlockchainError(false);
                addNotification({
                  type: 'success',
                  message: 'Successfully connected to blockchain',
                  important: true
                });
              } catch (error) {
                addNotification({
                  type: 'error',
                  message: 'Failed to connect to blockchain',
                  important: true
                });
              }
            }}
          >
            Retry Connection
          </Button>
        </DialogActions>
      </Dialog>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            Attendance Session
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={checkActiveSession}
              disabled={loading}
            >
              Refresh
            </Button>
            {sessionStatus === 'inactive' ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} /> : <StartIcon />}
                onClick={handleStartSession}
                disabled={loading}
              >
                Start Session
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                startIcon={loading ? <CircularProgress size={20} /> : <StopIcon />}
                onClick={handleEndSession}
                disabled={loading}
              >
                End Session
              </Button>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {sessionStatus === 'active' && (
          <>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ mb: 3 }}
            >
              <Tab icon={<QrIcon />} label="QR Code" />
              <Tab icon={<FaceIcon />} label="Face Recognition" />
            </Tabs>

            {activeTab === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <QRCode
                  value={sessionId}
                  size={256}
                  level="H"
                  includeMargin
                  imageSettings={{
                    src: '/logo.png',
                    height: 24,
                    width: 24,
                    excavate: true
                  }}
                />
              </Box>
            )}

            {activeTab === 1 && (
              <FaceRecognition
                sessionId={sessionId}
                onAttendanceMarked={handleAttendanceMarked}
              />
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Attendees ({attendees.length})
              </Typography>
              <Grid container spacing={2}>
                {attendees.map((attendee) => (
                  <Grid item xs={12} sm={6} md={4} key={attendee.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1">{attendee.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(attendee.timestamp * 1000).toLocaleTimeString()}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            size="small"
                            label={attendee.method}
                            color={attendee.method === 'Face' ? 'success' : 'primary'}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default AttendanceSession;
