import React from 'react';
import './styles.css';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  useTheme,
  alpha,
  Paper,
  IconButton
} from '@mui/material';
import {
  School as SchoolIcon,
  Face as FaceIcon,
  Timer as TimerIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

// Import styles at the top
import './styles.css';

const features = [
  {
    icon: <FaceIcon sx={{ fontSize: 40 }} />,
    title: 'Face Recognition',
    description: 'Advanced facial recognition technology for accurate attendance tracking'
  },
  {
    icon: <TimerIcon sx={{ fontSize: 40 }} />,
    title: 'Real-time Tracking',
    description: 'Monitor attendance in real-time with instant updates and notifications'
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    title: 'CCTV Integration',
    description: 'Integrated CCTV monitoring for enhanced security and verification'
  },
  {
    icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
    title: 'Analytics',
    description: 'Comprehensive analytics and reports for attendance patterns'
  },
  {
    icon: <NotificationsIcon sx={{ fontSize: 40 }} />,
    title: 'Smart Alerts',
    description: 'Instant notifications for attendance updates and anomalies'
  },
  {
    icon: <SchoolIcon sx={{ fontSize: 40 }} />,
    title: 'Multi-class Support',
    description: 'Support for multiple classes, departments, and courses'
  }
];

const Home = () => {
  const theme = useTheme();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
          color: 'white',
          py: 8,
          mb: 6,
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url(/assets/images/pattern.png) repeat',
            opacity: 0.1
          }
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
                Smart Attendance
              </Typography>
              <Typography variant="h5" paragraph sx={{ mb: 4, opacity: 0.9 }}>
                Revolutionize attendance tracking with AI-powered face recognition and real-time monitoring
              </Typography>
              <Button
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.9)
                  }
                }}
              >
                Get Started
              </Button>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box
                component="img"
                src="/assets/images/university-logo.png"
                alt="University Logo"
                sx={{ height: 40, mr: 2, display: 'block' }}
              />
              <Box
                component="img"
                src="/assets/images/hero-illustration.png"
                alt="Smart Attendance System"
                className="hero-image"
                sx={{
                  width: '100%',
                  maxWidth: 500,
                  height: 'auto',
                  filter: 'drop-shadow(0px 4px 20px rgba(0, 0, 0, 0.2))'
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          align="center"
          gutterBottom
          sx={{ mb: 6, fontWeight: 'bold' }}
        >
          Key Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                className="feature-card"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <CardContent>
                  <Box
                    className="feature-icon"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                      color: 'primary.main'
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Statistics Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'background.paper',
                  borderRadius: 2
                }}
              >
                <Typography variant="h3" color="primary.main" gutterBottom>
                  99.9%
                </Typography>
                <Typography variant="h6">Accuracy Rate</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'background.paper',
                  borderRadius: 2
                }}
              >
                <Typography variant="h3" color="primary.main" gutterBottom>
                  50K+
                </Typography>
                <Typography variant="h6">Students Tracked</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'background.paper',
                  borderRadius: 2
                }}
              >
                <Typography variant="h3" color="primary.main" gutterBottom>
                  24/7
                </Typography>
                <Typography variant="h6">Monitoring</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'primary.dark',
          color: 'white',
          py: 8,
          mt: 8,
          borderRadius: 2,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to Transform Your Attendance System?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of institutions using our smart attendance solution
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: alpha(theme.palette.common.white, 0.9),
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Get Started
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
