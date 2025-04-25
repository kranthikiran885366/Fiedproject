import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import CCTVStream from './CCTVStream';
import { useWebSocket } from '../../contexts/WebSocketContext';

const CCTVView = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket } = useWebSocket();

  useEffect(() => {
    if (socket) {
      socket.emit('get_cctv_streams');
      
      socket.on('cctv_streams', handleStreams);
      socket.on('cctv_error', handleError);

      return () => {
        socket.off('cctv_streams');
        socket.off('cctv_error');
      };
    }
  }, [socket]);

  const handleStreams = (data) => {
    setStreams(data);
    setLoading(false);
  };

  const handleError = (error) => {
    setError(error.message);
    setLoading(false);
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    socket?.emit('get_cctv_streams');
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
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        CCTV Monitoring
      </Typography>

      <Grid container spacing={3}>
        {streams.map((stream, index) => (
          <Grid item xs={12} md={6} lg={4} key={stream.id || index}>
            <Paper elevation={3}>
              <CCTVStream stream={stream} />
            </Paper>
          </Grid>
        ))}
      </Grid>

      {streams.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No active CCTV streams found
        </Alert>
      )}
    </Box>
  );
};

export default CCTVView;
