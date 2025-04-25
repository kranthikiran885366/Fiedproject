import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  LocationOn,
  MyLocation,
  History,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAttendance } from '../hooks/useAttendance';

const TrackerCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: '600px',
  margin: '0 auto'
}));

const LocationDisplay = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2)
}));

const GeolocationTracker = () => {
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const { getCurrentLocation, watchLocation, clearWatch } = useGeolocation();
  const { verifyLocation } = useAttendance();

  const handleStartTracking = async () => {
    try {
      setError(null);
      setTracking(true);

      // Get initial location
      const initialLocation = await getCurrentLocation();
      if (initialLocation) {
        addToHistory(initialLocation);
      }

      // Start watching location
      watchLocation(
        (location) => {
          addToHistory(location);
          verifyLocation(location);
        },
        (err) => setError(err.message)
      );
    } catch (err) {
      setError(err.message);
      setTracking(false);
    }
  };

  const handleStopTracking = () => {
    clearWatch();
    setTracking(false);
  };

  const addToHistory = (location) => {
    setLocationHistory((prev) => [
      {
        ...location,
        timestamp: new Date().toISOString()
      },
      ...prev.slice(0, 9) // Keep last 10 locations
    ]);
  };

  useEffect(() => {
    return () => {
      clearWatch();
    };
  }, []);

  const formatLocation = (location) => {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <TrackerCard>
      <Typography variant="h6" gutterBottom>
        Location Tracker
      </Typography>

      {/* Current Location */}
      {locationHistory[0] && (
        <LocationDisplay>
          <LocationOn color="primary" />
          <Box>
            <Typography variant="subtitle2">
              Current Location
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {formatLocation(locationHistory[0])}
            </Typography>
          </Box>
        </LocationDisplay>
      )}

      {/* Controls */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={tracking ? <CheckCircle /> : <MyLocation />}
          onClick={tracking ? handleStopTracking : handleStartTracking}
          color={tracking ? "success" : "primary"}
        >
          {tracking ? "Stop Tracking" : "Start Tracking"}
        </Button>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Location History */}
      {locationHistory.length > 0 && (
        <>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            <History sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Location History
          </Typography>
          <List>
            {locationHistory.map((location, index) => (
              <React.Fragment key={location.timestamp}>
                <ListItem>
                  <ListItemIcon>
                    {index === 0 ? (
                      <LocationOn color="primary" />
                    ) : (
                      <LocationOn color="action" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={formatLocation(location)}
                    secondary={formatTime(location.timestamp)}
                  />
                  {location.verified ? (
                    <CheckCircle color="success" sx={{ ml: 1 }} />
                  ) : (
                    <ErrorIcon color="error" sx={{ ml: 1 }} />
                  )}
                </ListItem>
                {index < locationHistory.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </>
      )}

      {tracking && !error && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="textSecondary">
            Tracking location...
          </Typography>
        </Box>
      )}
    </TrackerCard>
  );
};

export default GeolocationTracker;
