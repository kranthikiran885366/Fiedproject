import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  LinearProgress,
  Alert,
  IconButton
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Timer as TimerIcon,
  Check
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { useAttendance } from '../hooks/useAttendance';

const TimerCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: '400px',
  margin: '0 auto',
  textAlign: 'center'
}));

const TimeDisplay = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 500,
  fontFamily: 'monospace',
  marginBottom: theme.spacing(2)
}));

const Controls = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2)
}));

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const SessionTimer = ({ 
  sessionDuration = 3600, // 1 hour in seconds
  warningTime = 300, // 5 minutes in seconds
  onSessionComplete
}) => {
  const [timeLeft, setTimeLeft] = useState(sessionDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const { updateSessionTime } = useAttendance();

  const progress = ((sessionDuration - timeLeft) / sessionDuration) * 100;

  const handleStart = useCallback(() => {
    if (!sessionStarted) {
      setSessionStarted(true);
      updateSessionTime({ status: 'started', timestamp: new Date() });
    }
    setIsRunning(true);
    setIsPaused(false);
  }, [sessionStarted, updateSessionTime]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
    updateSessionTime({ status: 'paused', timestamp: new Date() });
  }, [updateSessionTime]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setSessionStarted(false);
    setTimeLeft(sessionDuration);
    setShowWarning(false);
    updateSessionTime({ status: 'stopped', timestamp: new Date() });
  }, [sessionDuration, updateSessionTime]);

  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);
    setSessionStarted(false);
    updateSessionTime({ status: 'completed', timestamp: new Date() });
    if (onSessionComplete) {
      onSessionComplete();
    }
  }, [onSessionComplete, updateSessionTime]);

  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          if (newTime <= warningTime && !showWarning) {
            setShowWarning(true);
          }
          if (newTime <= 0) {
            handleSessionComplete();
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, warningTime, showWarning, handleSessionComplete]);

  return (
    <TimerCard>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <TimerIcon sx={{ fontSize: 32, mr: 1 }} color="primary" />
        <Typography variant="h6">
          Session Timer
        </Typography>
      </Box>

      <TimeDisplay>
        {formatTime(timeLeft)}
      </TimeDisplay>

      <LinearProgress
        variant="determinate"
        value={progress}
        color={showWarning ? "warning" : "primary"}
        sx={{ mb: 3, height: 8, borderRadius: 4 }}
      />

      <Controls>
        {!isRunning && !sessionStarted && (
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handleStart}
          >
            Start Session
          </Button>
        )}

        {isRunning && (
          <IconButton
            color="primary"
            onClick={handlePause}
            size="large"
          >
            <Pause />
          </IconButton>
        )}

        {isPaused && (
          <IconButton
            color="primary"
            onClick={handleStart}
            size="large"
          >
            <PlayArrow />
          </IconButton>
        )}

        {sessionStarted && (
          <IconButton
            color="error"
            onClick={handleStop}
            size="large"
          >
            <Stop />
          </IconButton>
        )}
      </Controls>

      {showWarning && timeLeft > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Session ending in {formatTime(timeLeft)}
        </Alert>
      )}

      {timeLeft === 0 && (
        <Alert
          severity="success"
          icon={<Check />}
          sx={{ mb: 2 }}
        >
          Session completed successfully!
        </Alert>
      )}

      <Typography variant="body2" color="textSecondary">
        {isRunning ? "Session in progress" : isPaused ? "Session paused" : "Session not started"}
      </Typography>
    </TimerCard>
  );
};

export default SessionTimer;
