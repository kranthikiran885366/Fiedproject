const CCTVService = require('../services/cctvService');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const fs = require('fs');
const path = require('path');
const Student = require('../models/student');
const { FaceDetectionError } = require('../utils/errors');

// Mock socket.io
const mockIO = {
  emit: jest.fn(),
  to: jest.fn().mockReturnThis(),
  on: jest.fn()
};

// Mock models
jest.mock('../models/User', () => ({
  find: jest.fn()
}));

jest.mock('../models/Attendance', () => ({
  create: jest.fn()
}));

jest.mock('../models/Class', () => ({
  findById: jest.fn()
}));

jest.mock('face-api.js', () => ({
  nets: {
    faceRecognitionNet: {
      loadFromUri: jest.fn().mockResolvedValue(true)
    },
    faceLandmark68Net: {
      loadFromUri: jest.fn().mockResolvedValue(true)
    },
    ssdMobilenetv1: {
      loadFromUri: jest.fn().mockResolvedValue(true)
    }
  },
  detectSingleFace: jest.fn().mockResolvedValue({
    detection: {
      box: {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      }
    }
  }),
  LabeledFaceDescriptors: jest.fn().mockImplementation((label, descriptors) => ({
    label,
    descriptors
  })),
  FaceMatcher: jest.fn().mockImplementation(() => ({
    findBestMatch: jest.fn().mockReturnValue({
      label: 'test_student',
      distance: 0.5
    })
  }))
}));

describe('CCTVService', () => {
  let cctvService;
  const mockClassId = 'test-class-id';
  const mockStudentId = 'test-student-id';
  const mockFrameData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create service instance
    cctvService = new CCTVService(mockIO);

    // Mock user data
    User.find.mockResolvedValue([
      {
        _id: mockStudentId,
        name: 'Test Student',
        faceDescriptor: new Float32Array(128).fill(0.5)
      }
    ]);

    // Mock attendance creation
    Attendance.create.mockResolvedValue({
      _id: 'test-attendance-id',
      studentId: mockStudentId,
      classId: mockClassId,
      status: 'present'
    });

    // Mock class data
    Class.findById.mockResolvedValue({
      _id: mockClassId,
      name: 'Test Class'
    });

    await cctvService.initializeFaceAPI();

    mockStudent = await Student.create({
      name: 'Test Student',
      email: 'test.student@example.com',
      password: 'password123',
      enrollmentNumber: 'TEST123',
      department: 'Computer Science',
      faceDescriptor: [0.1, 0.2, 0.3]
    });
  });

  afterEach(async () => {
    // Clean up capture directory
    const capturePath = path.join(__dirname, '../../captures');
    if (fs.existsSync(capturePath)) {
      fs.readdirSync(capturePath).forEach(file => {
        fs.unlinkSync(path.join(capturePath, file));
      });
    }

    await Student.deleteMany({});
    await Attendance.deleteMany({});
  });

  describe('Initialization', () => {
    test('should initialize with correct properties', () => {
      expect(cctvService.io).toBe(mockIO);
      expect(cctvService.isMonitoring).toBe(false);
      expect(cctvService.faceMatcher).toBeNull();
      expect(cctvService.detectedFaces).toBeInstanceOf(Map);
    });

    test('should create capture directory if not exists', () => {
      const capturePath = path.join(__dirname, '../../captures');
      expect(fs.existsSync(capturePath)).toBe(true);
    });

    test('should initialize face API successfully', async () => {
      expect(cctvService.isInitialized).toBe(true);
    });
  });

  describe('Monitoring', () => {
    test('should start monitoring successfully', async () => {
      const result = await cctvService.startMonitoring(mockClassId);
      expect(result).toBe(true);
      expect(cctvService.isMonitoring).toBe(true);
      expect(cctvService.currentClassId).toBe(mockClassId);
      expect(cctvService.faceMatcher).not.toBeNull();
    });

    test('should stop monitoring successfully', async () => {
      await cctvService.startMonitoring(mockClassId);
      await cctvService.stopMonitoring();
      expect(cctvService.isMonitoring).toBe(false);
      expect(cctvService.currentClassId).toBeNull();
      expect(cctvService.faceMatcher).toBeNull();
    });
  });

  describe('Face Processing', () => {
    test('should process frame and detect faces', async () => {
      await cctvService.startMonitoring(mockClassId);
      await cctvService.processFrame(mockFrameData);
      
      // Verify that face detection was attempted
      expect(mockIO.emit).toHaveBeenCalled();
    });

    test('should handle recognized face and mark attendance', async () => {
      await cctvService.startMonitoring(mockClassId);
      
      // Mock face detection result
      const mockDetection = {
        detection: {
          box: { x: 0, y: 0, width: 100, height: 100 }
        },
        descriptor: new Float32Array(128).fill(0.5)
      };

      await cctvService.handleRecognizedFace(mockStudentId, {}, mockDetection);
      
      // Verify attendance was marked
      expect(Attendance.create).toHaveBeenCalled();
      expect(cctvService.detectedFaces.has(mockStudentId)).toBe(true);
    });

    test('should prevent duplicate detections within time window', async () => {
      await cctvService.startMonitoring(mockClassId);
      
      // First detection
      const mockDetection = {
        detection: {
          box: { x: 0, y: 0, width: 100, height: 100 }
        },
        descriptor: new Float32Array(128).fill(0.5)
      };

      await cctvService.handleRecognizedFace(mockStudentId, {}, mockDetection);
      
      // Second detection within time window
      await cctvService.handleRecognizedFace(mockStudentId, {}, mockDetection);
      
      // Verify attendance was only marked once
      expect(Attendance.create).toHaveBeenCalledTimes(1);
    });

    test('should handle face detection error', async () => {
      const mockFrame = 'mock_frame_data';
      const faceApi = require('face-api.js');
      faceApi.detectSingleFace.mockRejectedValue(new Error('Face detection failed'));
      
      await cctvService.startMonitoring('test_class_id');
      
      await expect(cctvService.processFrame(mockFrame)).rejects.toThrow(FaceDetectionError);
    });

    test('should prevent duplicate attendance marking', async () => {
      const mockFrame = 'mock_frame_data';
      await cctvService.startMonitoring('test_class_id');
      
      // First detection
      await cctvService.processFrame(mockFrame);
      
      // Second detection within 5 minutes
      await cctvService.processFrame(mockFrame);
      
      expect(Attendance.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Face Capture', () => {
    test('should capture and save face image', async () => {
      const mockCanvas = {
        width: 100,
        height: 100,
        getContext: jest.fn().mockReturnValue({
          drawImage: jest.fn()
        })
      };

      const mockDetection = {
        detection: {
          box: { x: 0, y: 0, width: 100, height: 100 }
        }
      };

      const capturePath = await cctvService.captureFace(mockCanvas, mockDetection);
      
      // Verify file was created
      expect(fs.existsSync(capturePath)).toBe(true);
      expect(capturePath).toMatch(/captures\/face_.*\.jpg$/);
    });
  });

  describe('Error Handling', () => {
    test('should handle errors during face processing', async () => {
      // Mock error in face detection
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await cctvService.startMonitoring(mockClassId);
      await cctvService.processFrame('invalid-frame-data');
      
      expect(console.error).toHaveBeenCalled();
    });

    test('should handle errors during attendance marking', async () => {
      // Mock error in attendance creation
      Attendance.create.mockRejectedValue(new Error('Database error'));
      
      const mockDetection = {
        detection: {
          box: { x: 0, y: 0, width: 100, height: 100 }
        },
        descriptor: new Float32Array(128).fill(0.5)
      };

      await cctvService.startMonitoring(mockClassId);
      await cctvService.handleRecognizedFace(mockStudentId, {}, mockDetection);
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  test('should get monitoring status', async () => {
    const status = cctvService.getMonitoringStatus();
    
    expect(status).toHaveProperty('isMonitoring');
    expect(status).toHaveProperty('currentClassId');
    expect(status).toHaveProperty('detectedFaces');
    expect(status).toHaveProperty('lastDetectionTimes');
  });
}); 