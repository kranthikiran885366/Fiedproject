import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  Badge
} from '@mui/material';
import {
  VideocamOff as VideoOffIcon,
  Warning as AlertIcon,
  Fullscreen as FullscreenIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';

const CCTVStream = ({ stream }) => {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const { socket } = useWebSocket();

  const initializeStream = useCallback(async () => {
    try {
      setLoading(true);
      if (videoRef.current) {
        videoRef.current.src = stream.url;
        await videoRef.current.play();
        setIsActive(true);
      }
    } catch (err) {
      setError('Failed to initialize video stream');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [stream.url]);

  useEffect(() => {
    if (socket && stream) {
      socket.on(`cctv_stream_${stream.id}`, handleStreamData);
      socket.on(`cctv_alert_${stream.id}`, handleAlert);

      return () => {
        socket.off(`cctv_stream_${stream.id}`);
        socket.off(`cctv_alert_${stream.id}`);
      };
    }
  }, [socket, stream]);

  useEffect(() => {
    if (stream?.url) {
      initializeStream();
    }
  }, [stream, initializeStream]);

  const handleStreamData = (data) => {
    if (data.active !== undefined) {
      setIsActive(data.active);
    }
  };

  const handleAlert = (alert) => {
    setAlerts(prev => [...prev, alert]);
    // Remove alert after 5 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
    }, 5000);
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleRefresh = () => {
    initializeStream();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
        <IconButton onClick={handleRefresh}>
          <RefreshIcon />
        </IconButton>
      </Box>
    );
  }

  return (
    <Card>
      <Box sx={{ position: 'relative' }}>
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: 'auto',
            display: isActive ? 'block' : 'none'
          }}
          muted
          playsInline
        />
        
        {!isActive && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 200,
              bgcolor: 'action.disabledBackground'
            }}
          >
            <VideoOffIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
          </Box>
        )}

        {/* Stream Info Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            p: 1,
            background: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant="subtitle2">
            {stream.name || 'CCTV Stream'}
          </Typography>
          <Box>
            <Tooltip title="View Fullscreen">
              <IconButton
                size="small"
                onClick={handleFullscreen}
                sx={{ color: 'white' }}
              >
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
            <Badge badgeContent={alerts.length} color="error">
              <IconButton
                size="small"
                sx={{ color: alerts.length > 0 ? 'error.main' : 'white' }}
              >
                <AlertIcon />
              </IconButton>
            </Badge>
          </Box>
        </Box>
      </Box>

      <CardContent>
        {alerts.map((alert, index) => (
          <Alert
            key={alert.id || index}
            severity={alert.severity || 'warning'}
            sx={{ mb: index < alerts.length - 1 ? 1 : 0 }}
          >
            {alert.message}
          </Alert>
        ))}
      </CardContent>

      {stream.location && (
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Typography variant="caption" color="text.secondary">
            Location: {stream.location}
          </Typography>
        </CardActions>
      )}
    </Card>
  );
};

export default CCTVStream;
