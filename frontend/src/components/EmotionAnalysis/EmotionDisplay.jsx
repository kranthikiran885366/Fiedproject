import React from 'react';
import { Box, Card, Typography, LinearProgress, Chip } from '@mui/material';
import { styled } from '@mui/system';
import {
  SentimentVerySatisfied,
  SentimentVeryDissatisfied,
  SentimentSatisfied,
  SentimentDissatisfied,
  Face,
  Mood,
  MoodBad
} from '@mui/icons-material';

const EmotionCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.background.default
}));

const EmotionBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
  gap: theme.spacing(2)
}));

const EmotionLabel = styled(Typography)({
  minWidth: '100px',
  fontWeight: 500
});

const EmotionProgress = styled(LinearProgress)(({ theme, emotion }) => {
  const emotionColors = {
    happy: theme.palette.success.main,
    sad: theme.palette.error.main,
    angry: theme.palette.error.dark,
    neutral: theme.palette.grey[500],
    surprise: theme.palette.info.main,
    fear: theme.palette.warning.main,
    disgust: theme.palette.error.light
  };

  return {
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.palette.grey[200],
    '& .MuiLinearProgress-bar': {
      backgroundColor: emotionColors[emotion] || theme.palette.primary.main
    }
  };
});

const EmotionIcon = ({ emotion, size = 24 }) => {
  const icons = {
    happy: <SentimentVerySatisfied sx={{ fontSize: size }} />,
    sad: <SentimentDissatisfied sx={{ fontSize: size }} />,
    angry: <SentimentVeryDissatisfied sx={{ fontSize: size }} />,
    neutral: <SentimentSatisfied sx={{ fontSize: size }} />,
    surprise: <Face sx={{ fontSize: size }} />,
    fear: <MoodBad sx={{ fontSize: size }} />,
    disgust: <Mood sx={{ fontSize: size }} />
  };

  return icons[emotion] || <Face sx={{ fontSize: size }} />;
};

const EmotionDisplay = ({ emotionData, showDetails = true }) => {
  if (!emotionData || !emotionData.success) {
    return (
      <EmotionCard>
        <Typography color="error">
          No emotion data available
        </Typography>
      </EmotionCard>
    );
  }

  const { primary_emotion, confidence, all_emotions } = emotionData;

  return (
    <EmotionCard>
      {/* Primary Emotion Display */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <EmotionIcon emotion={primary_emotion} size={48} />
        <Typography variant="h6" sx={{ mt: 1 }}>
          {primary_emotion.charAt(0).toUpperCase() + primary_emotion.slice(1)}
        </Typography>
        <Chip
          label={`${(confidence * 100).toFixed(1)}% Confidence`}
          color="primary"
          size="small"
          sx={{ mt: 1 }}
        />
      </Box>

      {/* Detailed Emotions */}
      {showDetails && all_emotions && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Emotion Breakdown
          </Typography>
          {all_emotions.map(({ emotion, confidence }) => (
            <EmotionBar key={emotion}>
              <EmotionLabel variant="body2">
                {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
              </EmotionLabel>
              <Box sx={{ flex: 1 }}>
                <EmotionProgress
                  variant="determinate"
                  value={confidence * 100}
                  emotion={emotion}
                />
              </Box>
              <Typography variant="body2" sx={{ minWidth: '50px' }}>
                {(confidence * 100).toFixed(1)}%
              </Typography>
            </EmotionBar>
          ))}
        </Box>
      )}
    </EmotionCard>
  );
};

export default EmotionDisplay;
