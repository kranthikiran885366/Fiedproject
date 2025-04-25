import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { SentimentVeryDissatisfied as SadIcon } from '@mui/icons-material';

const NotFound = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        gap: '1rem',
        textAlign: 'center',
        padding: '20px'
      }}
    >
      <SadIcon sx={{ fontSize: 64, color: theme.palette.primary.main }} />
      <Typography variant="h2" color="primary" gutterBottom>
        404
      </Typography>
      <Typography variant="h4" color="textPrimary" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/dashboard')}
        sx={{ mt: 2 }}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
};

export default NotFound;
