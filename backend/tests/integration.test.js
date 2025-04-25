const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Student = require('../models/student');
const Attendance = require('../models/attendance');
const Class = require('../models/class');
const { NotFoundError } = require('../utils/errors');

describe('Attendance System Integration Tests', () => {
  let studentToken;
  let facultyToken;
  let studentId;
  let classId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST);

    // Create test student
    const student = await Student.create({
      name: 'Test Student',
      email: 'test.student@example.com',
      password: 'password123',
      enrollmentNumber: 'TEST123',
      department: 'Computer Science'
    });
    studentId = student._id;

    // Create test class
    const testClass = await Class.create({
      name: 'Test Class',
      subject: 'Test Subject',
      faculty: new mongoose.Types.ObjectId()
    });
    classId = testClass._id;

    // Get tokens
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test.student@example.com',
        password: 'password123'
      });
    studentToken = studentLogin.body.token;

    const facultyLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test.faculty@example.com',
        password: 'password123'
      });
    facultyToken = facultyLogin.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await Student.deleteMany({});
    await Attendance.deleteMany({});
    await Class.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Student Features', () => {
    test('should fetch student attendance history', async () => {
      const response = await request(app)
        .get(`/api/students/${studentId}/attendance`)
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('records');
      expect(response.body).toHaveProperty('pagination');
    });

    test('should export attendance history as CSV', async () => {
      const response = await request(app)
        .get(`/api/students/${studentId}/attendance/export`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
    });
  });

  describe('CCTV Monitoring', () => {
    test('should start CCTV monitoring', async () => {
      const response = await request(app)
        .post('/api/cctv/start')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ classId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'monitoring');
    });

    test('should stop CCTV monitoring', async () => {
      const response = await request(app)
        .post('/api/cctv/stop')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'stopped');
    });
  });

  describe('Analytics', () => {
    test('should fetch attendance analytics', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .set('Authorization', `Bearer ${facultyToken}`)
        .query({ range: 'week' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('daily');
      expect(response.body).toHaveProperty('weekly');
      expect(response.body).toHaveProperty('monthly');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid student ID', async () => {
      const invalidId = 'invalid-id';
      const response = await request(app)
        .get(`/api/students/${invalidId}/attendance`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle unauthorized access', async () => {
      const response = await request(app)
        .get(`/api/students/${studentId}/attendance`)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
}); 