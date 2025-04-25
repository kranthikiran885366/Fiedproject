import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { socket, emitAttendanceMarked } = useWebSocket();
  const { user } = useAuth();

  useEffect(() => {
    let scanner = null;

    const onScanSuccess = async (decodedText) => {
      try {
        setScanning(false);
        scanner.clear();

        // Parse QR code data
        const sessionData = JSON.parse(decodedText);
        
        // Emit attendance data
        emitAttendanceMarked({
          sessionId: sessionData.sessionId,
          studentId: user.id,
          timestamp: new Date().toISOString(),
          method: 'qr',
          location: sessionData.location
        });
        
        setSuccess(true);
        toast.success('Attendance marked successfully!');
      } catch (err) {
        setError(err.message || 'Failed to process QR code');
        toast.error('Failed to process QR code');
      }
    };

    const onScanError = (error) => {
      console.warn('QR code scan error:', error);
    };

    const startScanner = () => {
      scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: 250,
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      });
      scanner.render(onScanSuccess, onScanError);
      setScanning(true);
      setError(null);
      setSuccess(false);
    };

    if (!scanning && !success) {
      startScanner();
    }

    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanning, success, emitAttendanceMarked, user]);

  const handleRetry = () => {
    setScanning(false);
    setError(null);
    setSuccess(false);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom align="center">
          QR Code Scanner
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {success ? (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Attendance marked successfully!
            </Alert>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRetry}
              sx={{ mt: 2 }}
            >
              Scan Another Code
            </Button>
          </Box>
        ) : (
          <>
            <Box id="qr-reader" sx={{ mb: 2 }} />
            
            {scanning ? (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography variant="body1" component="span">
                  Scanning...
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center">
                Position the QR code within the frame to scan
              </Typography>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default QRScanner;
