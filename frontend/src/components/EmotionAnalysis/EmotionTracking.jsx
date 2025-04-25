import React, { useEffect, useRef, useState } from 'react';
import { Box, Card, Typography, Grid, CircularProgress } from '@mui/material';
import { styled } from '@mui/system';
import EmotionDisplay from './EmotionDisplay';
import emotionAnalysisService from '../../services/emotionAnalysis.service';

const VideoContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '640px',
  margin: '0 auto',
  '& video': {
    width: '100%',
    borderRadius: theme.shape.borderRadius
  }
}));

const MetricsCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%'
}));

const EmotionTracking = () => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [emotionData, setEmotionData] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [sessionStats, setSessionStats] = useState(null);
  const trackingInterval = useRef(null);

  useEffect(() => {
    initializeCamera();
    return () => {
      stopTracking();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const startTracking = async () => {
    if (!stream) return;

    await emotionAnalysisService.loadModels();
    emotionAnalysisService.startSession();
    setIsTracking(true);

    trackingInterval.current = setInterval(async () => {
      if (videoRef.current) {
        const data = await emotionAnalysisService.detectEmotions(videoRef.current);
        if (data) {
          setEmotionData(data);
          updateSessionStats();
        }
      }
    }, 1000);
  };

  const stopTracking = () => {
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
      trackingInterval.current = null;
    }
    const report = emotionAnalysisService.endSession();
    if (report) {
      setSessionStats(report.summary);
    }
    setIsTracking(false);
  };

  const updateSessionStats = () => {
    const metrics = emotionAnalysisService.sessionData.engagementMetrics;
    setSessionStats({
      attentionSpanPercentage: metrics.totalAttentionSpan,
      averageEngagement: metrics.averageEngagement,
      distractionCount: metrics.distractionCount
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <VideoContainer>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />
          </VideoContainer>
        </Grid>

        <Grid item xs={12} md={4}>
          {emotionData ? (
            <EmotionDisplay emotionData={emotionData} />
          ) : (
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <CircularProgress size={40} />
              <Typography sx={{ mt: 1 }}>
                Initializing emotion tracking...
              </Typography>
            </Card>
          )}
        </Grid>

        {sessionStats && (
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <MetricsCard>
                  <Typography variant="h6" gutterBottom>
                    Attention Span
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {sessionStats.attentionSpanPercentage.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    of session time
                  </Typography>
                </MetricsCard>
              </Grid>

              <Grid item xs={12} md={4}>
                <MetricsCard>
                  <Typography variant="h6" gutterBottom>
                    Engagement Level
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {(sessionStats.averageEngagement * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    average engagement score
                  </Typography>
                </MetricsCard>
              </Grid>

              <Grid item xs={12} md={4}>
                <MetricsCard>
                  <Typography variant="h6" gutterBottom>
                    Distractions
                  </Typography>
                  <Typography variant="h4" color="error">
                    {sessionStats.distractionCount}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    attention drops detected
                  </Typography>
                </MetricsCard>
              </Grid>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default EmotionTracking;
