import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  useTheme
} from '@mui/material';
import {
  Face as FaceIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  School as SchoolIcon,
  Fingerprint as FingerprintIcon,
  Analytics as AnalyticsIcon,
  Notifications as NotificationsIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

const FeatureCard = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <Card 
      elevation={2}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-4px)',
          transition: 'transform 0.3s ease-in-out'
        }
      }}
    >
      <CardContent sx={{ p: 3, flex: 1 }}>
        <Box display="flex" alignItems="center" mb={2}>
          {icon}
          <Typography variant="h6" ml={1} fontWeight={600}>
            {title}
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  </motion.div>
);

const StatCard = ({ icon, number, label }) => (
  <Card
    elevation={2}
    sx={{
      height: '100%',
      p: 3,
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <Box color="primary.main" mb={2}>
      {React.cloneElement(icon, { style: { fontSize: 40 } })}
    </Box>
    <Typography variant="h3" fontWeight="bold" mb={1}>
      {number}
    </Typography>
    <Typography variant="subtitle1" color="text.secondary">
      {label}
    </Typography>
  </Card>
);

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const features = [
    {
      icon: <FaceIcon fontSize="large" color="primary" />,
      title: 'Face Recognition',
      description: 'Secure attendance marking using advanced facial recognition technology'
    },
    {
      icon: <SecurityIcon fontSize="large" color="primary" />,
      title: 'Blockchain Security',
      description: 'Immutable attendance records secured by blockchain technology'
    },
    {
      icon: <TimelineIcon fontSize="large" color="primary" />,
      title: 'Real-time Analytics',
      description: 'Advanced analytics and insights for attendance patterns'
    },
    {
      icon: <SchoolIcon fontSize="large" color="primary" />,
      title: 'Academic Integration',
      description: 'Seamless integration with academic management systems'
    },
    {
      icon: <FingerprintIcon fontSize="large" color="primary" />,
      title: 'Biometric Verification',
      description: 'Multi-factor authentication for enhanced security'
    },
    {
      icon: <AnalyticsIcon fontSize="large" color="primary" />,
      title: 'Predictive Analysis',
      description: 'AI-powered attendance predictions and insights'
    },
    {
      icon: <NotificationsIcon fontSize="large" color="primary" />,
      title: 'Smart Notifications',
      description: 'Automated alerts for attendance updates and patterns'
    },
    {
      icon: <LocationIcon fontSize="large" color="primary" />,
      title: 'Geo-fencing',
      description: 'Location-based attendance verification system'
    }
  ];

  const stats = [
    {
      icon: <FaceIcon />,
      number: '99.9%',
      label: 'Accuracy Rate'
    },
    {
      icon: <SchoolIcon />,
      number: '50+',
      label: 'Institutions'
    },
    {
      icon: <SecurityIcon />,
      number: '1M+',
      label: 'Students'
    },
    {
      icon: <NotificationsIcon />,
      number: '24/7',
      label: 'Support'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography
            variant="h2"
            color="primary"
            sx={{
              fontWeight: 800,
              mb: 3,
              fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' }
            }}
          >
            Automated Attendance System
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{
              mb: 4,
              maxWidth: '800px',
              mx: 'auto',
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}
          >
            Transform your attendance management with cutting-edge AI technology
            and blockchain security
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            alignItems="center"
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ 
                px: 4, 
                py: 1.5, 
                fontSize: '1.1rem',
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark
                }
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => navigate('/login')}
              sx={{ 
                px: 4, 
                py: 1.5, 
                fontSize: '1.1rem',
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.dark,
                  color: theme.palette.primary.dark
                }
              }}
            >
              Sign In
            </Button>
          </Stack>
        </motion.div>
      </Box>

      <Box sx={{ mb: { xs: 6, md: 10 } }}>
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={stat.label}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <StatCard {...stat} />
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box>
        <Typography
          variant="h3"
          color="primary"
          align="center"
          sx={{
            fontWeight: 700,
            mb: 6,
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}
        >
          Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={feature.title}>
              <FeatureCard {...feature} delay={index * 0.1} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default Home;
