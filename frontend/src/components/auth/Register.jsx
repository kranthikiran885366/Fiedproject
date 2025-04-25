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
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PhotoCamera, CameraAlt } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';

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

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    phone: '',
    department: '',
    enrollmentNumber: '',
    year: '',
    class: '',
    parentPhone: '',
    parentEmail: '',
    address: ''
  });
  const [activeStep, setActiveStep] = useState(0);
  const [photo, setPhoto] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const { register } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const steps = ['Personal Information', 'Academic Details', 'Contact Information', 'Photo Capture'];

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Personal Information
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        if (formData.password && formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        }
        break;
      case 1: // Academic Details
        if (!formData.department) newErrors.department = 'Department is required';
        if (!formData.enrollmentNumber) newErrors.enrollmentNumber = 'Enrollment number is required';
        if (!formData.year) newErrors.year = 'Year is required';
        if (!formData.class) newErrors.class = 'Class is required';
        break;
      case 2: // Contact Information
        if (!formData.phone) newErrors.phone = 'Phone number is required';
        if (!formData.parentPhone) newErrors.parentPhone = 'Parent phone number is required';
        if (!formData.parentEmail) newErrors.parentEmail = 'Parent email is required';
        if (!formData.address) newErrors.address = 'Address is required';
        break;
      case 3: // Photo Capture
        if (!photo) newErrors.photo = 'Photo is required';
        break;
      default:
        break;
    }

    setError(Object.values(newErrors)[0] || '');
    return Object.keys(newErrors).length === 0;
  };

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
    if (!validateStep(activeStep)) {
      enqueueSnackbar(error, { variant: 'error' });
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await register({
        ...formData,
        photo
      });
      
      enqueueSnackbar('Registration successful! Please login.', { variant: 'success' });
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Error during registration. Please try again.';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
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
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
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
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Department</InputLabel>
                <Select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  label="Department"
                >
                  <MenuItem value="CSE">Computer Science</MenuItem>
                  <MenuItem value="ECE">Electronics</MenuItem>
                  <MenuItem value="ME">Mechanical</MenuItem>
                  <MenuItem value="CE">Civil</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Year</InputLabel>
                <Select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  label="Year"
                >
                  <MenuItem value="1">First Year</MenuItem>
                  <MenuItem value="2">Second Year</MenuItem>
                  <MenuItem value="3">Third Year</MenuItem>
                  <MenuItem value="4">Fourth Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="class"
                label="Class/Section"
                value={formData.class}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
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
                name="parentPhone"
                label="Parent/Guardian Phone"
                value={formData.parentPhone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="parentEmail"
                label="Parent/Guardian Email"
                type="email"
                value={formData.parentEmail}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="address"
                label="Address"
                multiline
                rows={3}
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );
      case 3:
        return (
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
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Register
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Register'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register; 