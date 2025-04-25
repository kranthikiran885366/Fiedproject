import React from 'react';
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
  Chip,
} from '@mui/material';
import {
  Face,
  LocationOn,
  VideoCamera,
  Assessment,
  School,
  AccessTime,
  Notifications,
  Security,
  Psychology,
  CloudUpload,
  Dashboard,
  Group,
  AccountTree,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const FeatureCard = ({ icon, title, description, features, link }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        {features && (
          <Box sx={{ mb: 2 }}>
            {features.map((feature, index) => (
              <Chip
                key={index}
                label={feature}
                size="small"
                sx={{ m: 0.5 }}
                variant="outlined"
              />
            ))}
          </Box>
        )}
        {link && (
          <Button
            component={RouterLink}
            to={link}
            variant="outlined"
            size="small"
            sx={{ mt: 'auto' }}
          >
            Learn More
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const TechnologyStack = () => {
  const theme = useTheme();
  return (
    <Box sx={{ mt: 8, mb: 8 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Powered by Advanced Technology
      </Typography>
      <Grid container spacing={2} justifyContent="center" sx={{ mt: 4 }}>
        {[
          'React', 'Node.js', 'TensorFlow.js', 'WebSocket', 'JWT',
          'Blockchain', 'Face-API.js', 'MongoDB', 'Material-UI'
        ].map((tech) => (
          <Grid item key={tech}>
            <Chip
              label={tech}
              color="primary"
              variant="outlined"
              sx={{
                borderRadius: '16px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const HomePage = () => {
  const theme = useTheme();

  const featureCategories = [
    {
      title: 'Core Features',
      items: [
        {
          icon: <Security color="primary" fontSize="large" />,
          title: "User Authentication",
          description: "Role-based access control with JWT, secure login, and professional UI components.",
          features: ['Role-based access', 'JWT authentication', 'Session management']
        },
        {
          icon: <Face color="primary" fontSize="large" />,
          title: "Advanced Face Recognition",
          description: "Live face detection with anti-spoofing and real-time processing.",
          features: ['Liveness detection', 'Anti-spoofing', 'Real-time processing']
        },
        {
          icon: <VideoCamera color="primary" fontSize="large" />,
          title: "CCTV Integration",
          description: "Multi-camera support with real-time monitoring and WebSocket updates.",
          features: ['Live stream monitoring', 'Multi-camera support', 'Real-time detection']
        },
        {
          icon: <Assessment color="primary" fontSize="large" />,
          title: "Analytics & Reporting",
          description: "AI-powered attendance predictions and comprehensive trend analysis.",
          features: ['TensorFlow.js predictions', 'Trend analysis', 'Engagement metrics']
        }
      ]
    },
    {
      title: 'Advanced Technologies',
      items: [
        {
          icon: <AccountTree color="primary" fontSize="large" />,
          title: "Blockchain Integration",
          description: "Immutable attendance records with smart contracts and verification.",
          features: ['Smart contracts', 'Immutable storage', 'Audit trail']
        },
        {
          icon: <Dashboard color="primary" fontSize="large" />,
          title: "Admin Controls",
          description: "Comprehensive system monitoring and fraud detection capabilities.",
          features: ['Health monitoring', 'Fraud detection', 'User management']
        },
        {
          icon: <Notifications color="primary" fontSize="large" />,
          title: "Real-time Notifications",
          description: "WebSocket-based alerts for instant updates and fraud detection.",
          features: ['WebSocket alerts', 'Multi-channel delivery', 'Priority system']
        },
        {
          icon: <LocationOn color="primary" fontSize="large" />,
          title: "Location Intelligence",
          description: "Advanced geolocation tracking with suspicious activity detection.",
          features: ['Geolocation tracking', 'Distance validation', 'Activity monitoring']
        }
      ]
    },
    {
      title: 'Data Management',
      items: [
        {
          icon: <School color="primary" fontSize="large" />,
          title: "Enhanced User Model",
          description: "Comprehensive student and faculty information management.",
          features: ['Profile management', 'Authentication details', 'Activity tracking']
        },
        {
          icon: <AccessTime color="primary" fontSize="large" />,
          title: "Session Management",
          description: "Advanced class session tracking with multiple verification methods.",
          features: ['Real-time tracking', 'Multi-factor verification', 'Analytics']
        },
        {
          icon: <Group color="primary" fontSize="large" />,
          title: "Class Management",
          description: "Comprehensive course and enrollment management system.",
          features: ['Course management', 'Enrollment tracking', 'Schedule optimization']
        },
        {
          icon: <Psychology color="primary" fontSize="large" />,
          title: "Facial Data Management",
          description: "Secure storage and management of facial recognition data.",
          features: ['Secure storage', 'Quality metrics', 'Version control']
        }
      ]
    }
  ];

  const features = [
    {
      icon: <Face color="primary" fontSize="large" />,
      title: "Face Recognition",
      description: "Advanced facial recognition for secure and accurate attendance marking with liveness detection.",
      link: "/face-recognition"
    },
    {
      icon: <LocationOn color="primary" fontSize="large" />,
      title: "Geolocation",
      description: "GPS-based attendance verification to ensure students are physically present in class.",
      link: "/geolocation"
    },
    {
      icon: <VideoCamera color="primary" fontSize="large" />,
      title: "CCTV Integration",
      description: "Real-time monitoring and attendance tracking through integrated CCTV systems.",
      link: "/faculty/cctv"
    },
    {
      icon: <Assessment color="primary" fontSize="large" />,
      title: "Dynamic Reports",
      description: "Comprehensive attendance analytics with customizable reports and data visualization.",
      link: "/reports"
    },
    {
      icon: <School color="primary" fontSize="large" />,
      title: "Manual Attendance",
      description: "Traditional attendance marking with digital efficiency for faculty members.",
      link: "/faculty/manual-attendance"
    },
    {
      icon: <AccessTime color="primary" fontSize="large" />,
      title: "Session Management",
      description: "Flexible class session scheduling and attendance period configuration.",
      link: "/sessions"
    },
    {
      icon: <Notifications color="primary" fontSize="large" />,
      title: "Smart Notifications",
      description: "Automated alerts for attendance updates, low attendance warnings, and more.",
      link: "/notifications"
    },
    {
      icon: <Security color="primary" fontSize="large" />,
      title: "Role-Based Access",
      description: "Secure access control for students, faculty, and administrators.",
      link: "/login"
    },
    {
      icon: <Psychology color="primary" fontSize="large" />,
      title: "Sentiment Analysis",
      description: "AI-powered student engagement monitoring through sentiment analysis.",
      link: "/dashboard"
    },
    {
      icon: <CloudUpload color="primary" fontSize="large" />,
      title: "Data Export",
      description: "Export attendance data in multiple formats including PDF, Excel, and CSV.",
      link: "/reports"
    },
    {
      icon: <Dashboard color="primary" fontSize="large" />,
      title: "Interactive Dashboard",
      description: "Real-time attendance statistics and insights for better decision making.",
      link: "/dashboard"
    },
    {
      icon: <Group color="primary" fontSize="large" />,
      title: "Multi-User System",
      description: "Seamless collaboration between students, faculty, and administrators.",
      link: "/admin/users"
    }
  ];

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        pt: 8,
        pb: 6,
        background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
      }}
    >
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Smart Attendance System
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Revolutionizing attendance management with cutting-edge technology
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              size="large"
              sx={{ mr: 2 }}
            >
              Get Started
            </Button>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              size="large"
            >
              Sign In
            </Button>
          </Box>
        </Box>

        {/* Feature Categories */}
        {featureCategories.map((category, categoryIndex) => (
          <Box key={categoryIndex} sx={{ mb: 8 }}>
            <Typography variant="h4" align="center" gutterBottom sx={{ mb: 4 }}>
              {category.title}
            </Typography>
            <Grid container spacing={4}>
              {category.items.map((feature, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <FeatureCard {...feature} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}

        {/* Technology Stack */}
        <TechnologyStack />

        {/* Footer Section */}
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Ready to Transform Your Attendance System?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Join thousands of institutions already using our smart attendance solution.
          </Typography>
          <Button
            component={RouterLink}
            to="/register"
            variant="contained"
            size="large"
            sx={{ mt: 2 }}
          >
            Start Now
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
export default HomePage;
