import React, { useState, useRef, useCallback } from "react";
import { useSnackbar } from 'notistack';
import { TextField, Button, Grid, Paper, Typography, Container } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import axios from "axios";

const Signup = () => {
  const [formData, setFormData] = useState({
    regNumber: "",
    fullName: "",
    phoneNumber: "",
    dob: "",
    section: "",
    branch: "",
    course: "",
    parentName: "",
    parentPhone: "",
    counselor: "",
    email: "",
    password: "",
  });

  const [photo, setPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { enqueueSnackbar } = useSnackbar();
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  // Capture Photo
  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setPhoto(imageSrc);
    }
  }, [webcamRef]);

  // Handle Form Input Changes
  const validateField = (name, value) => {
    switch (name) {
      case 'regNumber':
        return /^[A-Z0-9]{8,}$/.test(value) ? '' : 'Invalid registration number';
      case 'phoneNumber':
      case 'parentPhone':
        return /^[0-9]{10}$/.test(value) ? '' : 'Invalid phone number';
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Invalid email address';
      case 'password':
        return value.length >= 8 ? '' : 'Password must be at least 8 characters';
      default:
        return value.trim() ? '' : 'This field is required';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit Form Data
  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      enqueueSnackbar('Please fix the errors before submitting.', { variant: 'error' });
      return;
    }

    if (!photo) {
      enqueueSnackbar('Please capture a photo before submitting.', { variant: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach((key) => formPayload.append(key, formData[key]));

      const blob = await fetch(photo).then((res) => res.blob());
      formPayload.append("photo", blob, "photo.jpg");

      console.log("Submitting data:", [...formPayload.entries()]);

      const response = await axios.post("http://localhost:4000/auth/register", formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Signup successful:", response.data);
      enqueueSnackbar(response.data.message || 'Signup successful!', { variant: 'success' });
      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error.response?.data || error.message);
      enqueueSnackbar(error.response?.data?.message || 'Signup failed. Please try again.', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} style={{ padding: "24px", marginTop: "40px", textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>Student Registration</Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {[
              { label: "Student Registration Number", name: "regNumber" },
              { label: "Full Name", name: "fullName" },
              { label: "Phone Number", name: "phoneNumber", type: "tel" },
              { label: "Date of Birth", name: "dob", type: "date", shrink: true },
              { label: "Section", name: "section" },
              { label: "Branch", name: "branch" },
              { label: "Course", name: "course" },
              { label: "Parent's Name", name: "parentName" },
              { label: "Parent's Phone Number", name: "parentPhone", type: "tel" },
              { label: "Counselor's Name", name: "counselor" },
              { label: "Email", name: "email", type: "email" },
              { label: "Password", name: "password", type: "password" },
            ].map((field, index) => (
              <Grid item xs={12} sm={field.shrink ? 6 : 12} key={index}>
                <TextField
                  fullWidth
                  required
                  label={field.label}
                  type={field.type || "text"}
                  name={field.name}
                  onChange={handleChange}
                  error={!!errors[field.name]}
                  helperText={errors[field.name]}
                  InputLabelProps={field.shrink ? { shrink: true } : undefined}
                  disabled={isSubmitting}
                />
              </Grid>
            ))}

            {/* Webcam Capture */}
            <Grid item xs={12}>
              <Typography variant="h6">Capture Your Photo</Typography>
              <Box sx={{ position: 'relative', width: '100%', mb: 2 }}>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width="100%"
                  height="auto"
                  videoConstraints={{
                    width: 1280,
                    height: 720,
                    facingMode: "user"
                  }}
                />
              </Box>
              <Button variant="contained" color="primary" onClick={capturePhoto} style={{ marginTop: "10px" }}>
                Capture Photo
              </Button>
              {photo && (
                <div>
                  <Typography variant="subtitle1">Captured Photo:</Typography>
                  <img src={photo} alt="Captured" width="100%" style={{ marginTop: "10px" }} />
                </div>
              )}
            </Grid>

            {/* Submit & Reset Buttons */}
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="success" fullWidth disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Register"}
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" color="secondary" fullWidth onClick={() => setPhoto(null)}>
                Reset
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                Already have an account? <Link to="/login">Login</Link>
              </Typography>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default Signup;
