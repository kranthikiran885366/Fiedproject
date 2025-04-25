import React from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  useTheme,
  Grid
} from '@mui/material';
import { styled } from '@mui/system';
import {
  Mood,
  Message,
  Psychology,
  Timeline,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from 'recharts';

const BehaviorCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%'
}));

const MetricBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2)
}));

const ScoreChip = styled(Chip)(({ theme, score }) => {
  const getColor = () => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return {
    backgroundColor: getColor(),
    color: theme.palette.common.white,
    fontWeight: 'bold'
  };
});

const TrendIcon = ({ value, size = 'small' }) => {
  if (value > 0) {
    return <TrendingUp color="success" fontSize={size} />;
  }
  if (value < 0) {
    return <TrendingDown color="error" fontSize={size} />;
  }
  return null;
};

const BehaviorDisplay = ({ behaviorData }) => {
  const theme = useTheme();

  if (!behaviorData) {
    return (
      <BehaviorCard>
        <Typography color="error">
          No behavior data available
        </Typography>
      </BehaviorCard>
    );
  }

  const {
    overallScore,
    emotionalState,
    sentimentAnalysis,
    behaviorMetrics,
    trends,
    observations
  } = behaviorData;

  // Format radar chart data
  const radarData = Object.entries(behaviorMetrics).map(([key, value]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    A: value,
    fullMark: 100
  }));

  return (
    <BehaviorCard>
      {/* Header with Overall Score */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Behavior Analysis
        </Typography>
        <ScoreChip
          label={`Score: ${overallScore}`}
          score={overallScore}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Key Metrics */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Key Metrics
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <MetricBox>
              <Mood color="primary" />
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Emotional State
                </Typography>
                <Typography variant="subtitle2">
                  {emotionalState.primary}
                  <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                    ({emotionalState.confidence}% confidence)
                  </Typography>
                </Typography>
              </Box>
            </MetricBox>
          </Grid>
          <Grid item xs={12} md={6}>
            <MetricBox>
              <Message color="primary" />
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Sentiment
                </Typography>
                <Typography variant="subtitle2">
                  {sentimentAnalysis.sentiment}
                  <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                    ({sentimentAnalysis.score}% positive)
                  </Typography>
                </Typography>
              </Box>
            </MetricBox>
          </Grid>
        </Grid>
      </Box>

      {/* Behavior Radar Chart */}
      <Box sx={{ height: 300, mb: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name="Behavior"
              dataKey="A"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.main}
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Box>

      {/* Trends */}
      <Typography variant="subtitle1" gutterBottom>
        Recent Trends
      </Typography>
      <List>
        {trends.map((trend, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <TrendIcon value={trend.change} />
            </ListItemIcon>
            <ListItemText
              primary={trend.metric}
              secondary={`${trend.change > 0 ? '+' : ''}${trend.change}% ${trend.period}`}
            />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Observations */}
      <Typography variant="subtitle1" gutterBottom>
        Key Observations
      </Typography>
      <List>
        {observations.map((observation, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <Psychology color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={observation.title}
              secondary={observation.description}
            />
          </ListItem>
        ))}
      </List>
    </BehaviorCard>
  );
};

export default BehaviorDisplay;
