const cv = require('opencv4nodejs');
const WebSocket = require('ws');
const FaceRecognitionService = require('./faceRecognitionService');
const AttendanceService = require('./attendanceService');
const Session = require('../models/Session');
const config = require('../config/cctvConfig');

class CCTVMonitoringService {
  constructor() {
    this.streams = new Map(); // Map of active CCTV streams
    this.faceRecognitionService = FaceRecognitionService;
    this.attendanceService = AttendanceService;
    this.processingInterval = 1000; // Process frames every 1 second
  }

  async initializeStream(sessionId, streamUrl) {
    try {
      if (this.streams.has(sessionId)) {
        throw new Error('Stream already exists for this session');
      }

      // Get session details
      const session = await Session.findById(sessionId)
        .populate('classId')
        .populate({
          path: 'classId',
          populate: { path: 'students.userId' }
        });

      if (!session) {
        throw new Error('Session not found');
      }

      // Initialize video capture
      const cap = new cv.VideoCapture(streamUrl);
      
      // Initialize WebSocket server for real-time streaming
      const wss = new WebSocket.Server({ 
        port: this.getAvailablePort(),
        path: `/cctv/${sessionId}`
      });

      const streamInfo = {
        sessionId,
        capture: cap,
        wss,
        isProcessing: false,
        lastProcessed: Date.now(),
        detectedFaces: new Map(), // Track detected faces
        attendanceMarked: new Set(), // Track marked attendance
        stream: {
          status: 'active',
          resolution: await this.getStreamResolution(cap),
          fps: await this.getStreamFPS(cap),
          startTime: Date.now()
        }
      };

      this.streams.set(sessionId, streamInfo);

      // Start processing
      this.startProcessing(sessionId);

      // Handle WebSocket connections
      wss.on('connection', (ws) => {
        console.log(`Client connected to CCTV stream ${sessionId}`);
        
        ws.on('close', () => {
          console.log(`Client disconnected from CCTV stream ${sessionId}`);
        });
      });

      return {
        status: 'success',
        streamUrl: `ws://localhost:${wss.address().port}/cctv/${sessionId}`,
        resolution: streamInfo.stream.resolution,
        fps: streamInfo.stream.fps
      };
    } catch (error) {
      throw new Error(`Failed to initialize CCTV stream: ${error.message}`);
    }
  }

  async startProcessing(sessionId) {
    const streamInfo = this.streams.get(sessionId);
    if (!streamInfo) {
      throw new Error('Stream not found');
    }

    streamInfo.processingInterval = setInterval(async () => {
      try {
        if (streamInfo.isProcessing || 
            Date.now() - streamInfo.lastProcessed < this.processingInterval) {
          return;
        }

        streamInfo.isProcessing = true;
        streamInfo.lastProcessed = Date.now();

        // Capture frame
        const frame = await streamInfo.capture.readAsync();
        if (frame.empty) {
          throw new Error('Empty frame received');
        }

        // Process frame
        await this.processFrame(sessionId, frame);

        // Send frame to connected clients
        this.broadcastFrame(sessionId, frame);

        streamInfo.isProcessing = false;
      } catch (error) {
        console.error(`Error processing CCTV frame: ${error.message}`);
        streamInfo.isProcessing = false;
      }
    }, this.processingInterval);
  }

  async processFrame(sessionId, frame) {
    const streamInfo = this.streams.get(sessionId);
    const session = await Session.findById(sessionId);

    // Convert frame to format suitable for face-api.js
    const processedFrame = await this.preprocessFrame(frame);

    // Detect faces
    const faces = await this.faceRecognitionService.detectMultipleFaces(processedFrame);

    // Process each detected face
    for (const face of faces) {
      try {
        // Verify liveness
        const livenessResult = await this.faceRecognitionService.verifyLiveness(face);
        if (!livenessResult.isLive) continue;

        // Find matching student
        const matchedStudent = await this.findMatchingStudent(face, session);
        if (!matchedStudent) continue;

        // Track face detection
        this.trackFaceDetection(sessionId, matchedStudent.userId, face);

        // Mark attendance if conditions are met
        await this.checkAndMarkAttendance(sessionId, matchedStudent.userId);
      } catch (error) {
        console.error(`Error processing face: ${error.message}`);
      }
    }

    // Update stream statistics
    this.updateStreamStats(sessionId, faces.length);
  }

  async preprocessFrame(frame) {
    // Convert OpenCV frame to format suitable for face-api.js
    const resized = frame.resize(640, 480);
    const buffer = cv.imencode('.jpg', resized).toString('base64');
    return Buffer.from(buffer, 'base64');
  }

  trackFaceDetection(sessionId, userId, face) {
    const streamInfo = this.streams.get(sessionId);
    const userDetections = streamInfo.detectedFaces.get(userId) || [];
    
    userDetections.push({
      timestamp: Date.now(),
      confidence: face.detection.score,
      location: face.detection.box
    });

    // Keep only last 30 seconds of detections
    const thirtySecondsAgo = Date.now() - 30000;
    const recentDetections = userDetections.filter(d => d.timestamp > thirtySecondsAgo);
    
    streamInfo.detectedFaces.set(userId, recentDetections);
  }

  async checkAndMarkAttendance(sessionId, userId) {
    const streamInfo = this.streams.get(sessionId);
    
    // Check if attendance already marked
    if (streamInfo.attendanceMarked.has(userId)) return;

    const detections = streamInfo.detectedFaces.get(userId) || [];
    const recentDetections = detections.filter(d => 
      d.timestamp > Date.now() - 30000 && d.confidence > 0.8
    );

    // Mark attendance if user was consistently detected for last 30 seconds
    if (recentDetections.length >= 15) { // At least 15 detections in 30 seconds
      try {
        await this.attendanceService.markAttendance({
          userId,
          sessionId,
          verificationMethod: 'cctv',
          location: streamInfo.stream.location,
          confidence: recentDetections.reduce((acc, d) => acc + d.confidence, 0) / recentDetections.length
        });

        streamInfo.attendanceMarked.add(userId);
      } catch (error) {
        console.error(`Error marking attendance: ${error.message}`);
      }
    }
  }

  broadcastFrame(sessionId, frame) {
    const streamInfo = this.streams.get(sessionId);
    const buffer = cv.imencode('.jpg', frame);
    const data = buffer.toString('base64');

    streamInfo.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'frame',
          data,
          timestamp: Date.now(),
          stats: streamInfo.stream
        }));
      }
    });
  }

  async stopStream(sessionId) {
    const streamInfo = this.streams.get(sessionId);
    if (!streamInfo) {
      throw new Error('Stream not found');
    }

    // Clear processing interval
    clearInterval(streamInfo.processingInterval);

    // Release video capture
    streamInfo.capture.release();

    // Close WebSocket server
    streamInfo.wss.close();

    // Remove stream info
    this.streams.delete(sessionId);

    // Update session
    await Session.findByIdAndUpdate(sessionId, {
      'cctvStreams.$[].status': 'inactive'
    });
  }

  async getStreamStats(sessionId) {
    const streamInfo = this.streams.get(sessionId);
    if (!streamInfo) {
      throw new Error('Stream not found');
    }

    return {
      ...streamInfo.stream,
      uptime: Date.now() - streamInfo.stream.startTime,
      detectedFaces: streamInfo.detectedFaces.size,
      attendanceMarked: streamInfo.attendanceMarked.size,
      clientsConnected: streamInfo.wss.clients.size
    };
  }

  async getStreamResolution(capture) {
    const frame = await capture.readAsync();
    return {
      width: frame.cols,
      height: frame.rows
    };
  }

  async getStreamFPS(capture) {
    return capture.get(cv.CAP_PROP_FPS);
  }

  getAvailablePort() {
    // Implement port finding logic
    return 8081; // Placeholder
  }

  updateStreamStats(sessionId, facesCount) {
    const streamInfo = this.streams.get(sessionId);
    streamInfo.stream.lastProcessed = Date.now();
    streamInfo.stream.facesDetected = facesCount;
    streamInfo.stream.processingLoad = streamInfo.isProcessing ? 'high' : 'normal';
  }
}

module.exports = new CCTVMonitoringService();
