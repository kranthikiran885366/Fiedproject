import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Card, Typography, CircularProgress, Alert } from '@mui/material';
import { Camera, Refresh, CheckCircle } from '@mui/icons-material';
import { styled } from '@mui/system';
import { useWebcam } from '../../hooks/useWebcam';
import { useFaceDetection } from '../../hooks/useFaceDetection';

const VideoContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '640px',
  margin: '0 auto',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  '& video': {
    width: '100%',
    height: 'auto',
    transform: 'scaleX(-1)', // Mirror effect
  }
}));

const OverlayCanvas = styled('canvas')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 1
});

const Controls = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  justifyContent: 'center',
  marginTop: theme.spacing(2)
}));

const FaceDetectionPanel = ({ onFaceDetected, mode = 'registration' }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionSuccess, setDetectionSuccess] = useState(false);

  const { 
    startWebcam, 
    stopWebcam, 
    isWebcamActive 
  } = useWebcam(videoRef, setError);

  const { 
    detectFace,
    drawFaceDetection 
  } = useFaceDetection(canvasRef);

  useEffect(() => {
    startWebcam();
    return () => stopWebcam();
  }, []);

  const handleCapture = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setDetectionSuccess(false);

      // Capture current video frame
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      // Detect face in the captured frame
      const detectionResult = await detectFace(canvas);

      if (!detectionResult.success) {
        throw new Error(detectionResult.error || 'Face detection failed');
      }

      // Draw detection results
      drawFaceDetection(detectionResult.faces);

      // Pass the face data to parent component
      if (onFaceDetected) {
        await onFaceDetected({
          imageData: canvas.toDataURL('image/jpeg'),
          faceData: detectionResult.faces
        });
      }

      setDetectionSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setDetectionSuccess(false);
    startWebcam();
  };

  return (
    <Card sx={{ p: 3, maxWidth: '700px', margin: '0 auto' }}>
      <Typography variant="h6" gutterBottom align="center">
        {mode === 'registration' ? 'Face Registration' : 'Face Recognition'}
      </Typography>

      <VideoContainer>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
        />
        <OverlayCanvas ref={canvasRef} />
      </VideoContainer>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Controls>
        {!isWebcamActive && (
          <Button
            variant="contained"
            startIcon={<Camera />}
            onClick={startWebcam}
          >
            Start Camera
          </Button>
        )}

        {isWebcamActive && (
          <>
            <Button
              variant="contained"
              startIcon={<Camera />}
              onClick={handleCapture}
              disabled={isProcessing || detectionSuccess}
            >
              {isProcessing ? (
                <>
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                  Processing...
                </>
              ) : (
                'Capture'
              )}
            </Button>

            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRetry}
              disabled={isProcessing}
            >
              Retry
            </Button>
          </>
        )}
      </Controls>

      {detectionSuccess && (
        <Alert 
          icon={<CheckCircle />}
          severity="success" 
          sx={{ mt: 2 }}
        >
          Face detected successfully!
        </Alert>
      )}
    </Card>
  );
};

export default FaceDetectionPanel;
