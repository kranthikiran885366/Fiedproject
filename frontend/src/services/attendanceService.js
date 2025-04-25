import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:40001/api';

const attendanceService = {
  // Mark attendance
  markAttendance: async (data) => {
    const response = await axios.post(`${API_URL}/attendance/mark`, data);
    return response.data;
  },

  // Get attendance history
  getAttendanceHistory: async (userId) => {
    const response = await axios.get(`${API_URL}/attendance/history/${userId}`);
    return response.data;
  },

  // Get attendance stats
  getAttendanceStats: async (userId) => {
    const response = await axios.get(`${API_URL}/attendance/stats/${userId}`);
    return response.data;
  },

  // Get session details
  getSessionDetails: async (sessionId) => {
    const response = await axios.get(`${API_URL}/attendance/session/${sessionId}`);
    return response.data;
  },

  // Start attendance session
  startSession: async (classId, settings) => {
    const response = await axios.post(`${API_URL}/attendance/session/start`, { classId, settings });
    return response.data;
  },

  // End attendance session
  endSession: async (sessionId) => {
    const response = await axios.put(`${API_URL}/attendance/session/${sessionId}/end`);
    return response.data;
  },

  // Verify face
  verifyFace: async (faceData) => {
    const response = await axios.post(`${API_URL}/attendance/verify/face`, { faceData });
    return response.data;
  },

  // Verify location
  verifyLocation: async (userLocation, sessionLocation) => {
    const response = await axios.post(`${API_URL}/attendance/verify/location`, {
      userLocation,
      sessionLocation
    });
    return response.data;
  },

  // Verify blockchain record
  verifyBlockchainRecord: async (attendanceId) => {
    const response = await axios.get(`${API_URL}/attendance/verify/blockchain/${attendanceId}`);
    return response.data;
  },

  // Get active sessions
  getActiveSessions: async () => {
    const response = await axios.get(`${API_URL}/attendance/sessions/active`);
    return response.data;
  },

  // Get attendance analytics
  getAnalytics: async (filters) => {
    const response = await axios.get(`${API_URL}/attendance/analytics`, { params: filters });
    return response.data;
  },

  // Submit correction request
  submitCorrectionRequest: async (data) => {
    const response = await axios.post(`${API_URL}/attendance/correction`, data);
    return response.data;
  },

  // Get correction requests
  getCorrectionRequests: async (filters) => {
    const response = await axios.get(`${API_URL}/attendance/corrections`, { params: filters });
    return response.data;
  },

  // Review correction request
  reviewCorrectionRequest: async (requestId, decision) => {
    const response = await axios.put(`${API_URL}/attendance/correction/${requestId}`, decision);
    return response.data;
  }
};

export default attendanceService;
