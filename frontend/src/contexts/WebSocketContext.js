import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_WEBSOCKET_URL, {
        auth: {
          token: localStorage.getItem('token')
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      // Socket event handlers
      newSocket.on('connect', () => {
        setConnected(true);
        console.log('WebSocket connected');
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
        console.log('WebSocket disconnected');
      });

      newSocket.on('error', (error) => {
        console.error('WebSocket error:', error);
        toast.error('Connection error. Trying to reconnect...');
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('WebSocket reconnected after', attemptNumber, 'attempts');
        toast.success('Reconnected to server');
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('WebSocket reconnection error:', error);
        toast.error('Failed to reconnect. Please refresh the page.');
      });

      // Custom event handlers
      newSocket.on('attendance_update', (data) => {
        console.log('Attendance update received:', data);
        // Handle attendance updates
      });

      newSocket.on('session_update', (data) => {
        console.log('Session update received:', data);
        // Handle session updates
      });

      newSocket.on('emotion_update', (data) => {
        console.log('Emotion update received:', data);
        // Handle emotion updates
      });

      newSocket.on('attendance_marked', (data) => {
        toast.info(`Attendance marked for ${data.studentName}`);
      });

      newSocket.on('session_started', (data) => {
        toast.info(`New attendance session started for ${data.className}`);
      });

      newSocket.on('session_ended', (data) => {
        toast.info(`Attendance session ended for ${data.className}`);
      });

      newSocket.on('emotion_detected', (data) => {
        if (data.emotion === 'distracted' || data.emotion === 'confused') {
          toast.warning(`Student ${data.studentName} appears ${data.emotion}`);
        }
      });

      newSocket.on('behavior_alert', (data) => {
        toast.warning(`Unusual behavior detected: ${data.description}`);
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [user]);

  const value = {
    socket,
    connected,
    // Helper methods
    emit: (event, data) => {
      if (socket && connected) {
        socket.emit(event, data);
      } else {
        console.warn('Socket not connected, cannot emit event:', event);
      }
    },
    on: (event, callback) => {
      if (socket) {
        socket.on(event, callback);
        return () => socket.off(event, callback);
      }
      return () => {};
    },
    off: (event, callback) => {
      if (socket) {
        socket.off(event, callback);
      }
    }
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;
