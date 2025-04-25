import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  SentimentSatisfied as HappyIcon,
  SentimentDissatisfied as SadIcon,
  SentimentVeryDissatisfied as AngryIcon,
  RemoveRedEye as AttentiveIcon,
  RemoveRedEyeOutlined as DistractedIcon
} from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';

const EmotionTracking = () => {
  const [emotionData, setEmotionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket } = useWebSocket();

  useEffect(() => {
    if (socket) {
      socket.on('emotion_data', handleEmotionData);
      socket.on('emotion_error', handleError);

      return () => {
        socket.off('emotion_data');
        socket.off('emotion_error');
      };
    }
  }, [socket]);

  const handleEmotionData = (data) => {
    setEmotionData(data);
    setLoading(false);
  };

  const handleError = (error) => {
    setError(error.message);
    setLoading(false);
  };

  const getEmotionIcon = (emotion) => {
    switch (emotion.toLowerCase()) {
      case 'happy':
        return <HappyIcon color="success" />;
      case 'sad':
        return <SadIcon color="info" />;
      case 'angry':
        return <AngryIcon color="error" />;
      case 'attentive':
        return <AttentiveIcon color="success" />;
      case 'distracted':
        return <DistractedIcon color="warning" />;
      default:
        return null;
    }
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
      <Typography variant="h5" gutterBottom>
        Emotion Tracking
      </Typography>

      <Grid container spacing={3}>
        {/* Overall Class Mood */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Class Mood Overview
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {emotionData?.predominantEmotion && (
                <>
                  {getEmotionIcon(emotionData.predominantEmotion)}
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    Predominant Emotion: {emotionData.predominantEmotion}
                  </Typography>
                </>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Emotion Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emotion Distribution
              </Typography>
              {emotionData?.distribution && Object.entries(emotionData.distribution).map(([emotion, percentage]) => (
                <Box key={emotion} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {emotion}
                    </Typography>
                    <Typography variant="body2">
                      {percentage}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={percentage} 
                    color={
                      emotion === 'happy' || emotion === 'attentive' ? 'success' :
                      emotion === 'sad' ? 'info' :
                      emotion === 'angry' ? 'error' :
                      'warning'
                    }
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Attention Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attention Metrics
              </Typography>
              {emotionData?.attentionMetrics && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Class Attention Level
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={emotionData.attentionMetrics.classAttention} 
                      color="primary"
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                    <Typography variant="body2" align="right" sx={{ mt: 0.5 }}>
                      {emotionData.attentionMetrics.classAttention}%
                    </Typography>
                  </Box>

                  <Alert 
                    severity={
                      emotionData.attentionMetrics.classAttention > 75 ? 'success' :
                      emotionData.attentionMetrics.classAttention > 50 ? 'info' :
                      'warning'
                    }
                  >
                    {emotionData.attentionMetrics.message || 'Class is being monitored'}
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmotionTracking;
