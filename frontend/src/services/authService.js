import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const AUTH_KEY = 'smart_attendance_token';

class AuthService {
  async register(userData) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      if (response.data.token) {
        localStorage.setItem(AUTH_KEY, response.data.token);
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async login(credentials) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      if (response.data.token) {
        localStorage.setItem(AUTH_KEY, response.data.token);
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async validateToken(token) {
    try {
      const response = await axios.get(`${API_URL}/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProfile(data) {
    try {
      const token = this.getToken();
      const response = await axios.put(
        `${API_URL}/auth/profile`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  logout() {
    localStorage.removeItem(AUTH_KEY);
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  getToken() {
    return localStorage.getItem(AUTH_KEY);
  }

  handleError(error) {
    if (error.response) {
      // Server responded with error
      const message = error.response.data.message || error.response.data.error;
      return new Error(message || 'An error occurred');
    } else if (error.request) {
      // Request made but no response
      return new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      return new Error('An unexpected error occurred');
    }
  }
}

const authService = new AuthService();
export default authService;
