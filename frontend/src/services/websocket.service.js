import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (!this.socket) {
      this.socket = io(process.env.REACT_APP_WEBSOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      this.setupDefaultListeners();
    }
    return this.socket;
  }

  setupDefaultListeners() {
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  // Subscribe to real-time attendance updates
  subscribeToAttendance(sessionId, callback) {
    const event = `attendance:${sessionId}`;
    this.socket.on(event, callback);
    this.listeners.set(event, callback);
  }

  // Subscribe to CCTV stream updates
  subscribeToCCTVStream(cameraId, callback) {
    const event = `cctv:${cameraId}`;
    this.socket.on(event, callback);
    this.listeners.set(event, callback);
  }

  // Subscribe to face recognition events
  subscribeToFaceRecognition(sessionId, callback) {
    const event = `face:${sessionId}`;
    this.socket.on(event, callback);
    this.listeners.set(event, callback);
  }

  // Subscribe to fraud detection alerts
  subscribeToFraudAlerts(sessionId, callback) {
    const event = `fraud:${sessionId}`;
    this.socket.on(event, callback);
    this.listeners.set(event, callback);
  }

  // Emit attendance marked event
  emitAttendanceMarked(data) {
    this.socket.emit('attendance:marked', data);
  }

  // Emit face detected event
  emitFaceDetected(data) {
    this.socket.emit('face:detected', data);
  }

  // Emit fraud detected event
  emitFraudDetected(data) {
    this.socket.emit('fraud:detected', data);
  }

  // Unsubscribe from all events
  unsubscribeAll() {
    this.listeners.forEach((callback, event) => {
      this.socket.off(event, callback);
    });
    this.listeners.clear();
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.socket) {
      this.unsubscribeAll();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const webSocketService = new WebSocketService();
