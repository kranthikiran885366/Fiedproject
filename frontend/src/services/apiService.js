import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Update as per backend URL

export const apiService = {
  getAttendance: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/attendance`);
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  },

  markAttendance: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/attendance`, data);
      return response.data;
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  },

  getReports: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reports`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },
};

export default apiService;
