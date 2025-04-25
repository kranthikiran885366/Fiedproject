import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import {
  School,
  Person,
  AdminPanelSettings,
  Security,
  Speed,
  Notifications,
  Face,
  LocationOn,
  Timeline,
  Assessment
} from '@mui/icons-material';

const Home = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                Smart Attendance System
              </Typography>
              <Typography variant="h5" paragraph>
                Revolutionize attendance tracking with AI-powered face recognition and real-time verification.
              </Typography>
              <Box sx={{ mt: 4 }}>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  color="secondary"
                  size="large"
                  sx={{ mr: 2 }}
                >
                  Get Started
                </Button>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  color="inherit"
                  size="large"
                >
                  Login
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/hero-image.png"
                alt="Smart Attendance"
                sx={{
                  width: '100%',
                  maxWidth: 500,
                  height: 'auto',
                  display: 'block',
                  margin: 'auto'
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h3" align="center" gutterBottom color="primary">
          Key Features
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Face sx={{ fontSize: 60, color: 'primary.main' }} />
                </Box>
                <Typography variant="h5" align="center" gutterBottom>
                  Face Recognition
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                  Advanced AI-powered face recognition for secure and accurate attendance marking.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <LocationOn sx={{ fontSize: 60, color: 'primary.main' }} />
                </Box>
                <Typography variant="h5" align="center" gutterBottom>
                  Location Verification
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                  Real-time location verification to ensure attendance is marked from the correct location.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Timeline sx={{ fontSize: 60, color: 'primary.main' }} />
                </Box>
                <Typography variant="h5" align="center" gutterBottom>
                  Real-time Tracking
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                  Instant attendance updates and real-time tracking of attendance status.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Role-Based Access Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom color="primary">
            Role-Based Access
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <School sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
                <Typography variant="h5" align="center" gutterBottom>
                  Students
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Speed color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Mark attendance easily" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Assessment color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="View attendance history" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Notifications color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Receive attendance alerts" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Person sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
                <Typography variant="h5" align="center" gutterBottom>
                  Faculty
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Assessment color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Manage classes" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Timeline color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="View attendance reports" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Notifications color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Send attendance notifications" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <AdminPanelSettings sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
                <Typography variant="h5" align="center" gutterBottom>
                  Admin
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Security color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Full system control" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Assessment color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Advanced analytics" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Person color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="User management" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Call to Action */}
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom color="primary">
          Ready to Get Started?
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Join our smart attendance system today and experience the future of attendance tracking.
        </Typography>
        <Button
          component={Link}
          to="/register"
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 2 }}
        >
          Register Now
        </Button>
      </Container>
    </Box>
  );
};

export default Home; 