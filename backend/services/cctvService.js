const mockCCTVStreams = [
  {
    id: 'cctv-1',
    name: 'Main Entrance',
    location: 'Building A',
    url: 'http://localhost:4000/api/cctv/stream/1',
    active: true
  },
  {
    id: 'cctv-2',
    name: 'Classroom 101',
    location: 'Building B',
    url: 'http://localhost:4000/api/cctv/stream/2',
    active: true
  },
  {
    id: 'cctv-3',
    name: 'Library',
    location: 'Building C',
    url: 'http://localhost:4000/api/cctv/stream/3',
    active: true
  }
];

const tf = require('@tensorflow/tfjs');
const faceapi = require('face-api.js');
const { Canvas, Image, ImageData } = require('canvas');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Class = require('../models/Class');
const fs = require('fs');
const path = require('path');

class CCTVService {
  constructor(io) {
    this.io = io;
    this.streams = [...mockCCTVStreams];
    this.detectedFaces = new Map();
    this.faceMatcher = null;
    this.isMonitoring = false;
    this.captureInterval = null;
    this.capturePath = path.join(__dirname, '../../captures');
    this.setupSocketHandlers();
    this.startMockAlerts();
    this.initializeFaceAPI();
    this.ensureCaptureDirectory();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected to CCTV service');

      socket.on('get_cctv_streams', () => {
        socket.emit('cctv_streams', this.streams);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected from CCTV service');
      });
    });
  }

  startMockAlerts() {
    // Simulate random alerts
    setInterval(() => {
      const randomStream = this.streams[Math.floor(Math.random() * this.streams.length)];
      const alertTypes = ['motion_detected', 'person_detected', 'unauthorized_access'];
      const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      
      const alert = {
        id: Date.now(),
        type: randomAlert,
        message: this.getAlertMessage(randomAlert),
        severity: this.getAlertSeverity(randomAlert),
        timestamp: new Date().toISOString()
      };

      this.io.emit(`cctv_alert_${randomStream.id}`, alert);
    }, 10000); // Send alert every 10 seconds

    // Simulate stream status changes
    setInterval(() => {
      const randomStream = this.streams[Math.floor(Math.random() * this.streams.length)];
      randomStream.active = !randomStream.active;
      this.io.emit(`cctv_stream_${randomStream.id}`, { active: randomStream.active });
    }, 30000); // Change stream status every 30 seconds
  }

  getAlertMessage(type) {
    switch (type) {
      case 'motion_detected':
        return 'Motion detected in monitored area';
      case 'person_detected':
        return 'Person detected in restricted area';
      case 'unauthorized_access':
        return 'Unauthorized access attempt detected';
      default:
        return 'Unknown alert';
    }
  }

  getAlertSeverity(type) {
    switch (type) {
      case 'motion_detected':
        return 'info';
      case 'person_detected':
        return 'warning';
      case 'unauthorized_access':
        return 'error';
      default:
        return 'info';
    }
  }

  ensureCaptureDirectory() {
    if (!fs.existsSync(this.capturePath)) {
      fs.mkdirSync(this.capturePath, { recursive: true });
    }
  }

  async initializeFaceAPI() {
    try {
      // Initialize TensorFlow.js
      await tf.ready();
      
      // Load face detection models
      await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
      await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
      await faceapi.nets.faceRecognitionNet.loadFromDisk('./models');
      console.log('Face API models loaded successfully');
    } catch (error) {
      console.error('Error initializing face detection:', error);
      throw error;
    }
  }

  async startMonitoring(classId) {
    try {
      this.isMonitoring = true;
      this.currentClassId = classId;
      
      // Load known faces for the class
      const students = await User.find({ role: 'student' });
      const labeledDescriptors = await this.loadLabeledDescriptors(students);
      this.faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
      
      // Start automatic capture
      this.startAutomaticCapture();
      
      console.log(`CCTV monitoring started for class ${classId}`);
      return true;
    } catch (error) {
      console.error('Error starting CCTV monitoring:', error);
      return false;
    }
  }

  startAutomaticCapture() {
    // Clear any existing interval
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
    }

    // Set up automatic capture every 5 seconds
    this.captureInterval = setInterval(() => {
      if (this.isMonitoring && this.lastFrame) {
        this.processFrame(this.lastFrame);
      }
    }, 5000);
  }

  async stopMonitoring() {
    this.isMonitoring = false;
    this.currentClassId = null;
    this.faceMatcher = null;
    this.detectedFaces.clear();
    
    // Clear capture interval
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    
    console.log('CCTV monitoring stopped');
  }

  async processFrame(frameData) {
    if (!this.isMonitoring || !this.faceMatcher) return;

    try {
      // Store the last frame for automatic capture
      this.lastFrame = frameData;

      // Convert frame data to image
      const img = await this.loadImage(frameData);
      const canvas = new Canvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Detect faces
      const detections = await faceapi.detectAllFaces(canvas)
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Recognize faces
      const results = detections.map(d => this.faceMatcher.findBestMatch(d.descriptor));
      
      // Process recognized faces and capture images
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.distance < 0.6) { // Confidence threshold
          const studentId = result.label;
          await this.handleRecognizedFace(studentId, canvas, detections[i]);
        }
      }

      // Emit detection results
      this.io.to(`class-${this.currentClassId}`).emit('face-detections', {
        timestamp: new Date(),
        detections: results.map((r, i) => ({
          label: r.label,
          distance: r.distance,
          recognized: r.distance < 0.6,
          box: detections[i].detection.box
        }))
      });

    } catch (error) {
      console.error('Error processing frame:', error);
    }
  }

  async handleRecognizedFace(studentId, canvas, detection) {
    const now = Date.now();
    const lastDetection = this.detectedFaces.get(studentId);

    // Prevent duplicate detections within 5 minutes
    if (lastDetection && (now - lastDetection) < 300000) {
      return;
    }

    try {
      // Capture and save the face image
      const faceImage = await this.captureFace(canvas, detection);
      
      // Mark attendance
      await Attendance.create({
        studentId,
        classId: this.currentClassId,
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        verificationMethod: 'cctv_face_recognition',
        timestamp: new Date(),
        capturePath: faceImage
      });

      // Update last detection time
      this.detectedFaces.set(studentId, now);

      // Emit attendance event
      this.io.to(`class-${this.currentClassId}`).emit('attendance-marked', {
        studentId,
        timestamp: new Date(),
        method: 'cctv_face_recognition',
        capturePath: faceImage
      });

      console.log(`Attendance marked for student ${studentId}`);
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  }

  async captureFace(canvas, detection) {
    const box = detection.detection.box;
    const faceCanvas = new Canvas(box.width, box.height);
    const faceCtx = faceCanvas.getContext('2d');
    
    // Extract face from the main canvas
    faceCtx.drawImage(
      canvas,
      box.x, box.y, box.width, box.height,
      0, 0, box.width, box.height
    );

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `face_${timestamp}.jpg`;
    const filepath = path.join(this.capturePath, filename);

    // Save the face image
    const buffer = faceCanvas.toBuffer('image/jpeg');
    fs.writeFileSync(filepath, buffer);

    return filepath;
  }

  async loadLabeledDescriptors(students) {
    const labeledDescriptors = [];
    
    for (const student of students) {
      if (student.faceDescriptor) {
        labeledDescriptors.push(
          new faceapi.LabeledFaceDescriptors(
            student._id.toString(),
            [new Float32Array(student.faceDescriptor)]
          )
        );
      }
    }
    
    return labeledDescriptors;
  }

  async loadImage(data) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = data;
    });
  }

  async getMonitoringStatus() {
    return {
      isMonitoring: this.isMonitoring,
      classId: this.currentClassId,
      detectedFaces: Array.from(this.detectedFaces.entries()).map(([id, time]) => ({
        studentId: id,
        lastDetection: new Date(time)
      }))
    };
  }
}

module.exports = CCTVService;
