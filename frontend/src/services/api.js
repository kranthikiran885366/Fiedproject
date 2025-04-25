import axios from 'axios';

const API_URL = 'http://localhost:40001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);

// User settings services
export const getSettings = () => api.get('/user/settings');
export const updateSettings = (settings) => api.put('/user/settings', settings);

// Student services
export const getStudents = () => api.get('/students');
export const addStudent = (studentData) => api.post('/students', studentData);
export const updateStudent = (id, studentData) => api.put(`/students/${id}`, studentData);
export const deleteStudent = (id) => api.delete(`/students/${id}`);

// Class services
export const getClasses = () => api.get('/classes');
export const addClass = (classData) => api.post('/classes', classData);
export const updateClass = (id, classData) => api.put(`/classes/${id}`, classData);
export const deleteClass = (id) => api.delete(`/classes/${id}`);

// Attendance services
export const markAttendance = (attendanceData) => api.post('/attendance', attendanceData);
export const getAttendance = (classId, date) => api.get(`/attendance/${classId}/${date}`);
export const getAttendanceStats = () => api.get('/attendance/stats');

export default api;
