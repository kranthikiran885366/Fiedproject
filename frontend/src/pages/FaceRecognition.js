import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert
} from '@mui/material';
import { Check } from '@mui/icons-material';
import FaceDetectionPanel from '../components/FaceDetection/FaceDetectionPanel';
import EmotionDisplay from '../components/EmotionAnalysis/EmotionDisplay';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const steps = ['Face Detection', 'Emotion Analysis', 'Verification'];

const FaceRecognition = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [faceData, setFaceData] = useState(null);
  const [emotionData, setEmotionData] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const handleFaceDetected = async (data) => {
    try {
      setFaceData(data);
      
      // Send face data for emotion analysis
      const emotionResult = await attendanceAPI.verifyFace({
        userId: user.id,
        faceData: data.faceData,
        imageData: data.imageData
      });

      setEmotionData(emotionResult.emotions);
      setActiveStep(1);
    } catch (err) {
      setError(err.message || 'Face detection failed');
    }
  };

  const handleVerification = async () => {
    try {
      const result = await attendanceAPI.markAttendance({
        userId: user.id,
        faceData,
        emotionData,
        timestamp: new Date().toISOString()
      });

      setVerificationStatus(result);
      setActiveStep(2);
    } catch (err) {
      setError(err.message || 'Verification failed');
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setFaceData(null);
    setEmotionData(null);
    setVerificationStatus(null);
    setError(null);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom align="center">
          Face Recognition Attendance
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mt: 3, mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          {activeStep === 0 && (
            <FaceDetectionPanel
              onFaceDetected={handleFaceDetected}
              mode="recognition"
            />
          )}

          {activeStep === 1 && (
            <Box>
              <EmotionDisplay emotionData={emotionData} />
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  onClick={handleVerification}
                  size="large"
                >
                  Verify & Mark Attendance
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 2 && verificationStatus?.success && (
            <Box sx={{ textAlign: 'center' }}>
              <Check
                sx={{
                  fontSize: 60,
                  color: 'success.main',
                  mb: 2
                }}
              />
              <Typography variant="h6" gutterBottom>
                Attendance Marked Successfully!
              </Typography>
              <Typography color="textSecondary" paragraph>
                {verificationStatus.message}
              </Typography>
              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{ mt: 2 }}
              >
                Mark Another Attendance
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default FaceRecognition;
