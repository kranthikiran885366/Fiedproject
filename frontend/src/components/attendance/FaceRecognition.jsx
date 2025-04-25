import React from 'react';
import { default as MuiBox } from '@mui/material/Box';
import { default as MuiButton } from '@mui/material/Button';
import { default as MuiTypography } from '@mui/material/Typography';
import { default as MuiCircularProgress } from '@mui/material/CircularProgress';
import { default as MuiAlert } from '@mui/material/Alert';
import { default as MuiPaper } from '@mui/material/Paper';
import { default as MuiGrid } from '@mui/material/Grid';
import { default as MuiCameraIcon } from '@mui/icons-material/Camera';
import { default as MuiSuccessIcon } from '@mui/icons-material/CheckCircle';
import { default as MuiRefreshIcon } from '@mui/icons-material/Refresh';
import { default as MuiWarningIcon } from '@mui/icons-material/Warning';
import { default as MuiLinearProgress } from '@mui/material/LinearProgress';
import Webcam from 'react-webcam';
import aiService from '../../services/ai.service';
import blockchainService from '../../services/blockchain.service';
import useAuth from '../../hooks/useAuth';
import useNotifications from '../../hooks/useNotifications';

const FaceRecognition = ({ sessionId, onAttendanceMarked }) => {
  const webcamRef = React.useRef(null);
  const [capturing, setCapturing] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [cameraError, setCameraError] = React.useState(false);
  const [aiInitialized, setAiInitialized] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  React.useEffect(() => {
    initializeAI();
    
    // Request camera permissions early
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setCameraError(false))
      .catch(() => setCameraError(true));
      
    return () => {
      // Cleanup camera stream on unmount
      if (webcamRef.current && webcamRef.current.stream) {
        const tracks = webcamRef.current.stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const initializeAI = async () => {
    try {
      setProcessing(true);
      await aiService.initialize();
      setAiInitialized(true);
      setError(null);
    } catch (err) {
      setError('Failed to initialize face recognition. Please refresh the page.');
      console.error('AI initialization error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const retryInitialization = async () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      await initializeAI();
    } else {
      setError('Maximum retry attempts reached. Please refresh the page.');
    }
  };

  const handleCapture = async () => {
    if (!webcamRef.current) return;

    try {
      setCapturing(true);
      setError(null);

      // Ensure camera is ready
      if (!webcamRef.current.stream) {
        throw new Error('Camera not initialized. Please check camera permissions.');
      }

      // Capture image from webcam
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Failed to capture image from webcam');
      }

      // Create an image element for face detection
      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      setProcessing(true);

      // Detect faces in the image
      const faces = await aiService.detectFaces(img);
      
      if (!faces || faces.length === 0) {
        throw new Error('No face detected. Please ensure your face is clearly visible.');
      }

      if (faces.length > 1) {
        throw new Error('Multiple faces detected. Please ensure only your face is visible.');
      }

      // Analyze behavior
      const behavior = await aiService.analyzeBehavior(faces[0], img);
      
      // Check for suspicious behavior
      if (behavior.suspicious) {
        throw new Error('Suspicious behavior detected. Please try again.');
      }

      // Verify face against registered face
      const isMatch = await aiService.verifyFace(faces[0], user.id);
      if (!isMatch) {
        throw new Error('Face does not match registered user. Please try again.');
      }

      // Mark attendance on blockchain
      await blockchainService.markAttendance(sessionId, user.id);

      // Add notification
      addNotification({
        type: 'success',
        message: 'Attendance marked successfully',
        important: true
      });

      setSuccess(true);
      onAttendanceMarked?.(user.id);

    } catch (err) {
      setError(err.message || 'Failed to process face recognition');
      console.error('Face recognition error:', err);
      
      addNotification({
        type: 'error',
        message: err.message || 'Face recognition failed',
        important: true
      });
    } finally {
      setCapturing(false);
      setProcessing(false);
    }
  };

  if (cameraError) {
    return (
      <MuiPaper sx={{ p: 3, textAlign: 'center' }}>
        <MuiWarningIcon color="warning" sx={{ fontSize: 48, mb: 2 }} />
        <MuiTypography variant="h6" gutterBottom>
          Camera Access Required
        </MuiTypography>
        <MuiTypography color="text.secondary" paragraph>
          Please enable camera access in your browser settings to use face recognition.
        </MuiTypography>
        <MuiButton
          variant="contained"
          onClick={() => window.location.reload()}
        >
          Retry Camera Access
        </MuiButton>
      </MuiPaper>
    );
  }

  return (
    <MuiPaper sx={{ p: 3 }}>
      {error && (
        <MuiAlert
          severity="error"
          sx={{ mb: 2 }}
          action={
            !aiInitialized && (
              <MuiButton
                color="inherit"
                size="small"
                onClick={retryInitialization}
                disabled={processing || retryCount >= 3}
                startIcon={<MuiRefreshIcon />}
              >
                Retry
              </MuiButton>
            )
          }
        >
          {error}
        </MuiAlert>
      )}

      <MuiGrid container spacing={3}>
        <MuiGrid item xs={12} md={8}>
          <MuiBox
            sx={{
              position: 'relative',
              width: '100%',
              height: 0,
              paddingBottom: '75%',
              backgroundColor: 'black',
              borderRadius: 1,
              overflow: 'hidden'
            }}
          >
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: 1280,
                height: 720,
                facingMode: "user"
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            {(capturing || processing) && (
              <MuiBox
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}
              >
                <MuiCircularProgress color="primary" />
              </MuiBox>
            )}
          </MuiBox>
        </MuiGrid>

        <MuiGrid item xs={12} md={4}>
          <MuiBox sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <MuiTypography variant="h6" gutterBottom>
              Face Recognition
            </MuiTypography>
            
            {!aiInitialized ? (
              <>
                <MuiTypography variant="body2" color="text.secondary" gutterBottom>
                  Initializing face recognition...
                </MuiTypography>
                <MuiLinearProgress />
              </>
            ) : success ? (
              <MuiBox sx={{ textAlign: 'center', py: 2 }}>
                <MuiSuccessIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
                <MuiTypography variant="h6" gutterBottom color="success.main">
                  Attendance Marked Successfully
                </MuiTypography>
              </MuiBox>
            ) : (
              <MuiButton
                fullWidth
                variant="contained"
                size="large"
                onClick={handleCapture}
                disabled={capturing || processing || !aiInitialized}
                startIcon={<MuiCameraIcon />}
              >
                Capture & Verify
              </MuiButton>
            )}

            <MuiBox sx={{ flexGrow: 1 }} />

            <MuiTypography variant="body2" color="text.secondary">
              Please ensure:
              <ul>
                <li>Your face is clearly visible</li>
                <li>You are in a well-lit environment</li>
                <li>You are looking directly at the camera</li>
                <li>Only your face is in the frame</li>
              </ul>
            </MuiTypography>
          </MuiBox>
        </MuiGrid>
      </MuiGrid>
    </MuiPaper>
  );
};

export default FaceRecognition;
