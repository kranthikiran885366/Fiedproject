import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Psychology as BehaviorIcon,
  Visibility as AttentionIcon,
  Warning as WarningIcon,
  CheckCircle as GoodIcon
} from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';

const BehaviorDisplay = () => {
  const [behaviorData, setBehaviorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket } = useWebSocket();

  useEffect(() => {
    if (socket) {
      socket.on('behavior_update', handleBehaviorUpdate);
      socket.on('behavior_error', handleError);

      return () => {
        socket.off('behavior_update');
        socket.off('behavior_error');
      };
    }
  }, [socket]);

  const handleBehaviorUpdate = (data) => {
    setBehaviorData(data);
    setLoading(false);
  };

  const handleError = (error) => {
    setError(error.message);
    setLoading(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <BehaviorIcon sx={{ mr: 1 }} />
        Behavior Analysis
      </Typography>

      <Grid container spacing={3}>
        {/* Attention Level */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AttentionIcon sx={{ mr: 1 }} />
                Attention Level
              </Typography>
              {behaviorData?.attentionLevel && (
                <>
                  <LinearProgress
                    variant="determinate"
                    value={behaviorData.attentionLevel}
                    color={
                      behaviorData.attentionLevel > 75 ? 'success' :
                      behaviorData.attentionLevel > 50 ? 'info' :
                      'warning'
                    }
                    sx={{ height: 10, borderRadius: 5, mb: 1 }}
                  />
                  <Typography variant="body2" align="right">
                    {behaviorData.attentionLevel}%
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Current Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Activity
              </Typography>
              {behaviorData?.currentActivity && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {behaviorData.currentActivity.isPositive ? (
                    <GoodIcon color="success" sx={{ mr: 1 }} />
                  ) : (
                    <WarningIcon color="warning" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="body1">
                    {behaviorData.currentActivity.description}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Behavior Patterns */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Behavior Patterns
            </Typography>
            <Grid container spacing={2}>
              {behaviorData?.patterns?.map((pattern, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Alert 
                    severity={pattern.type || 'info'}
                    sx={{ '& .MuiAlert-message': { width: '100%' } }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      {pattern.title}
                    </Typography>
                    <Typography variant="body2">
                      {pattern.description}
                    </Typography>
                    {pattern.frequency && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" display="block" gutterBottom>
                          Frequency
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={pattern.frequency} 
                          sx={{ height: 5, borderRadius: 5 }}
                        />
                      </Box>
                    )}
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Alerts */}
        {behaviorData?.alerts?.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Alerts
              </Typography>
              <Grid container spacing={1}>
                {behaviorData.alerts.map((alert, index) => (
                  <Grid item xs={12} key={index}>
                    <Alert severity={alert.severity || 'info'}>
                      {alert.message}
                    </Alert>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default BehaviorDisplay;
