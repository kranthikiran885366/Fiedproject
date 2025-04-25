import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { styled } from '@mui/system';
import { QrCodeScanner, Refresh } from '@mui/icons-material';
import QrReader from 'react-qr-reader';
import { useAttendance } from '../hooks/useAttendance';
import { useGeolocation } from '../hooks/useGeolocation';

const ScannerContainer = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: '500px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2)
}));

const QRViewport = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '400px',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  '& > div': {
    width: '100% !important',
    height: 'auto !important'
  }
}));

const QRCodeScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { markAttendance } = useAttendance();
  const { getCurrentLocation } = useGeolocation();

  const handleError = (err) => {
    setError('Failed to access camera: ' + err.message);
    setScanning(false);
  };

  const handleScan = async (data) => {
    if (data) {
      try {
        setScanning(false);
        
        // Get current location
        const location = await getCurrentLocation();
        
        // Verify QR code and mark attendance
        const result = await markAttendance({
          qrData: data,
          location: location,
          timestamp: new Date().toISOString()
        });

        if (result.success) {
          setSuccess(true);
          setError(null);
        } else {
          throw new Error(result.error || 'Failed to mark attendance');
        }
      } catch (err) {
        setError(err.message);
        setSuccess(false);
      }
    }
  };

  const handleRetry = () => {
    setScanning(true);
    setError(null);
    setSuccess(false);
  };

  useEffect(() => {
    setScanning(true);
  }, []);

  return (
    <ScannerContainer>
      <Typography variant="h6" gutterBottom>
        QR Code Scanner
      </Typography>

      {scanning && (
        <QRViewport>
          <QrReader
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: '100%' }}
            facingMode="environment"
          />
        </QRViewport>
      )}

      {!scanning && !success && (
        <Button
          variant="contained"
          startIcon={<QrCodeScanner />}
          onClick={handleRetry}
        >
          Start Scanning
        </Button>
      )}

      {error && (
        <Alert 
          severity="error" 
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRetry}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success">
          Attendance marked successfully!
        </Alert>
      )}

      {scanning && (
        <Typography variant="body2" color="textSecondary" align="center">
          Point your camera at the QR code to mark attendance
        </Typography>
      )}
    </ScannerContainer>
  );
};

export default QRCodeScanner;
