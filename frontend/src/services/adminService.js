import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL;

class AdminService {
  async getDashboardStats() {
    try {
      const response = await axios.get(`${API_URL}/api/admin/dashboard/stats`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getFraudAlerts() {
    try {
      const response = await axios.get(`${API_URL}/api/admin/alerts/fraud`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching fraud alerts:', error);
      throw error;
    }
  }

  async handleFraudAlert(alertId, action) {
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/alerts/fraud/${alertId}`,
        { action },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error handling fraud alert:', error);
      throw error;
    }
  }

  async checkSystemHealth() {
    try {
      const response = await axios.get(`${API_URL}/api/admin/system/health`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error checking system health:', error);
      throw error;
    }
  }

  async getAttendanceReports(filters) {
    try {
      const response = await axios.get(`${API_URL}/api/admin/reports/attendance`, {
        params: filters,
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance reports:', error);
      throw error;
    }
  }

  async manageUsers(action, userData) {
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/users/${action}`,
        userData,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error managing users:', error);
      throw error;
    }
  }

  async configureCCTV(config) {
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/system/cctv/configure`,
        config,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error configuring CCTV:', error);
      throw error;
    }
  }

  async getSystemLogs(filters) {
    try {
      const response = await axios.get(`${API_URL}/api/admin/system/logs`, {
        params: filters,
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching system logs:', error);
      throw error;
    }
  }

  async updateSystemSettings(settings) {
    try {
      const response = await axios.put(
        `${API_URL}/api/admin/system/settings`,
        settings,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  async getBlockchainStats() {
    try {
      const response = await axios.get(`${API_URL}/api/admin/blockchain/stats`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching blockchain stats:', error);
      throw error;
    }
  }

  async verifyAttendanceRecords(recordIds) {
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/attendance/verify`,
        { recordIds },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error verifying attendance records:', error);
      throw error;
    }
  }

  getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Error handler utility
  handleError(error) {
    const message = error.response?.data?.message || 'An error occurred';
    toast.error(message);
    throw error;
  }
}

export default new AdminService();
