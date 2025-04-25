import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Webcam from 'react-webcam';
import aiService from '../../services/ai.service';

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openCamera, setOpenCamera] = useState(false);
  const webcamRef = useRef(null);
  const [faceData, setFaceData] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [captureQuality, setCaptureQuality] = useState({ brightness: 0, sharpness: 0 });
  const [autoCapture, setAutoCapture] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
    frameRate: 30
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const analyzeFrame = useCallback(async () => {
    if (!webcamRef.current || !openCamera) return;

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Detect faces
      const faces = await aiService.detectFaces(img);
      if (!faces || faces.length === 0) {
        setCaptureQuality({ brightness: 0, sharpness: 0 });
        return;
      }

      if (faces.length > 1) {
        setError('Multiple faces detected. Please ensure only your face is visible.');
        return;
      }

      const face = faces[0];
      const quality = {
        brightness: face.quality.brightness,
        sharpness: face.quality.sharpness
      };

      setCaptureQuality(quality);

      // Auto capture if quality is good
      if (autoCapture && 
          quality.brightness >= 0.4 && 
          quality.sharpness >= 0.5 &&
          Math.abs(face.pose.yaw) < 15 && 
          Math.abs(face.pose.pitch) < 15) {
        await handleCaptureFace(imageSrc, face);
      }

    } catch (err) {
      console.error('Frame analysis error:', err);
    }
  }, [openCamera, autoCapture]);

  useEffect(() => {
    let frameAnalysisInterval;
    if (openCamera && !faceData) {
      frameAnalysisInterval = setInterval(analyzeFrame, 500);
    }
    return () => {
      if (frameAnalysisInterval) {
        clearInterval(frameAnalysisInterval);
      }
    };
  }, [openCamera, analyzeFrame, faceData]);

  const handleCaptureFace = async (imageSrc, detectedFace) => {
    if (capturing) return;

    try {
      setCapturing(true);
      setError('');
      setCaptureProgress(0);

      // If no image provided, take a new screenshot
      if (!imageSrc) {
        imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
          throw new Error('Failed to capture image');
        }
      }

      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      setCaptureProgress(30);

      // Detect face if not provided
      const face = detectedFace || (await aiService.detectFaces(img))[0];
      if (!face) {
        throw new Error('No face detected. Please ensure your face is clearly visible.');
      }

      setCaptureProgress(60);

      // Quality checks
      if (face.quality.brightness < 0.4) {
        throw new Error('Image too dark. Please ensure better lighting.');
      }

      if (face.quality.sharpness < 0.5) {
        throw new Error('Image not clear. Please keep your face still and ensure camera is focused.');
      }

      if (Math.abs(face.pose.yaw) > 15 || Math.abs(face.pose.pitch) > 15) {
        throw new Error('Please look directly at the camera.');
      }

      setCaptureProgress(90);

      // Get face embedding
      const embedding = face.embedding;
      setFaceData({ imageSrc, embedding });
      setOpenCamera(false);
      setCaptureProgress(100);
    } catch (err) {
      setError(err.message || 'Failed to capture face');
    } finally {
      setCapturing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!faceData) {
      setError('Please register your face for attendance');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Register user with face data
      await register({
        ...formData,
        faceEmbedding: faceData.embedding,
        faceImage: faceData.imageSrc
      });
      
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 2
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%'
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Create Account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
            required
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="faculty">Faculty</MenuItem>
            </Select>
          </FormControl>

          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={() => {
              setOpenCamera(true);
              setError('');
              setCaptureQuality({ brightness: 0, sharpness: 0 });
            }}
            sx={{ mt: 2 }}
          >
            {faceData ? 'Retake Face Photo' : 'Register Face'}
          </Button>

          {faceData && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Face registered successfully!
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign Up'}
          </Button>
        </form>

        <Typography align="center" sx={{ mt: 2 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ textDecoration: 'none' }}>
            Login
          </Link>
        </Typography>
      </Paper>

      <Dialog 
        open={openCamera} 
        onClose={() => !capturing && setOpenCamera(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Register Your Face</DialogTitle>
        <DialogContent>
          <Box sx={{ position: 'relative', width: '100%', height: 'auto' }}>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              style={{ width: '100%', height: 'auto' }}
              mirrored
            />
            {capturing && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress variant="determinate" value={captureProgress} />
              </Box>
            )}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Quality Metrics:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography variant="body2" color={captureQuality.brightness >= 0.4 ? 'success.main' : 'error.main'}>
                  Brightness: {Math.round(captureQuality.brightness * 100)}%
                </Typography>
                <Typography variant="body2" color={captureQuality.sharpness >= 0.5 ? 'success.main' : 'error.main'}>
                  Sharpness: {Math.round(captureQuality.sharpness * 100)}%
                </Typography>
              </Box>
            </Box>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Please ensure:
            <ul>
              <li>Your face is clearly visible</li>
              <li>Good lighting conditions</li>
              <li>Look directly at the camera</li>
              <li>No other faces in the frame</li>
            </ul>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setAutoCapture(!autoCapture)}
            color="primary"
          >
            {autoCapture ? 'Disable Auto Capture' : 'Enable Auto Capture'}
          </Button>
          <Button onClick={() => !capturing && setOpenCamera(false)}>Cancel</Button>
          <Button 
            onClick={() => handleCaptureFace()} 
            variant="contained" 
            color="primary"
            disabled={capturing || captureQuality.brightness < 0.4 || captureQuality.sharpness < 0.5}
          >
            {capturing ? 'Capturing...' : 'Capture Manually'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Signup;
