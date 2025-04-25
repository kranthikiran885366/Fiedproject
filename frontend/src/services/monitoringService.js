import axios from 'axios';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL;
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

class MonitoringService {
  constructor() {
    this.socket = null;
    this.stream = null;
    this.detectionInterval = null;
  }

  async initializeSocket() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      this.socket.on('connect', () => {
        console.log('Connected to monitoring socket');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from monitoring socket');
      });

      this.socket.on('fraud_alert', (data) => {
        this.handleFraudAlert(data);
      });
    }
  }

  async getCCTVStream(classId) {
    try {
      // Initialize WebSocket connection for real-time updates
      await this.initializeSocket();

      // Join the class room for real-time updates
      this.socket.emit('join_class', { classId });

      // Get CCTV stream URL
      const response = await axios.get(
        `${API_URL}/api/monitoring/cctv/stream/${classId}`,
        { headers: this.getAuthHeader() }
      );

      // Create MediaStream from CCTV feed
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: response.data.deviceId
        }
      });

      this.stream = stream;
      return stream;
    } catch (error) {
      console.error('Error getting CCTV stream:', error);
      throw error;
    }
  }

  async processDetections(data) {
    try {
      const response = await axios.post(
        `${API_URL}/api/monitoring/detections`,
        data,
        { headers: this.getAuthHeader() }
      );

      // Emit detection data through socket for real-time updates
      this.socket.emit('detection_processed', {
        classId: data.classId,
        detections: response.data
      });

      return response.data;
    } catch (error) {
      console.error('Error processing detections:', error);
      throw error;
    }
  }

  async verifyLiveness(imageData) {
    try {
      const response = await axios.post(
        `${API_URL}/api/monitoring/verify-liveness`,
        { imageData },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error verifying liveness:', error);
      throw error;
    }
  }

  async checkSpoofing(detectionData) {
    try {
      const response = await axios.post(
        `${API_URL}/api/monitoring/check-spoofing`,
        detectionData,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error checking spoofing:', error);
      throw error;
    }
  }

  handleFraudAlert(data) {
    // Implement fraud alert handling logic
    console.warn('Fraud Alert:', data);
    // You can emit an event or call a callback function here
  }

  stopMonitoring() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}

export default new MonitoringService();
