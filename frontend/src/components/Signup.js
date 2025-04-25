import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PhotoCamera, CameraAlt } from '@mui/icons-material';
import axios from 'axios';

const VideoContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: 400,
  margin: '1rem auto',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const Video = styled('video')({
  width: '100%',
  borderRadius: 'inherit',
});

const CaptureButton = styled(Button)(({ theme }) => ({
  position: 'absolute',
  bottom: '1rem',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: theme.palette.success.main,
  '&:hover': {
    backgroundColor: theme.palette.success.dark,
  },
}));

const PreviewImage = styled('img')({
  width: '100%',
  maxWidth: 400,
  margin: '1rem auto',
  borderRadius: 'inherit',
  display: 'block',
});

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    phone: '',
    department: '',
    enrollmentNumber: ''
  });
  const [photo, setPhoto] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setIsCapturing(true);
      setError('');
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Error accessing camera. Please ensure you have granted camera permissions.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg');
    setPhoto(imageData);
    setIsCapturing(false);

    // Stop the video stream
    video.srcObject.getTracks().forEach(track => track.stop());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:40001/api/auth/signup', {
        ...formData,
        photo
      });
      
      if (response.data.success) {
        navigate('/login', { state: { message: 'Signup successful! Please login.' } });
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.response?.data?.message || 'Error during signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Sign Up
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="name"
                label="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="department"
                label="Department"
                value={formData.department}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="enrollmentNumber"
                label="Enrollment Number"
                value={formData.enrollmentNumber}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            {!photo && !isCapturing && (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CameraAlt />}
                onClick={startCamera}
              >
                Start Camera
              </Button>
            )}

            {isCapturing && (
              <VideoContainer>
                <Video ref={videoRef} autoPlay playsInline />
                <CaptureButton
                  variant="contained"
                  startIcon={<PhotoCamera />}
                  onClick={capturePhoto}
                >
                  Capture Photo
                </CaptureButton>
              </VideoContainer>
            )}

            {photo && (
              <Box sx={{ textAlign: 'center' }}>
                <PreviewImage src={photo} alt="Captured" />
                <Button
                  variant="outlined"
                  startIcon={<CameraAlt />}
                  onClick={startCamera}
                  sx={{ mt: 1 }}
                >
                  Retake Photo
                </Button>
              </Box>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={!photo || loading}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Signup; 