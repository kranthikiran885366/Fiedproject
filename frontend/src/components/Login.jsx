import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Typography, Box, Link, Paper, Container } from "@mui/material";
import "../styles/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // Hook for redirection

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Simulating authentication (Replace with actual API call)
    if (email === "admin@example.com" && password === "password") {
      console.log("Login successful");
      navigate("/dashboard"); // Redirect to Dashboard
    } else {
      alert("Invalid credentials. Please try again.");
    }
  };

  return (
    <Container className="login-container">
      <Paper elevation={3} className="login-box">
        <Typography variant="h5" className="login-title">Login</Typography>
        <Box component="form" onSubmit={handleLogin} className="login-form">
          <TextField
            label="Enter your email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Enter your password"
            type="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Link href="#" className="forgot-password">Forgot password?</Link>
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Login
          </Button>
        </Box>
        <Typography className="signup-text">
          Don't have an account? <Link href="/signup">Signup</Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default Login;
