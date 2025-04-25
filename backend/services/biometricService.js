const tf = require('@tensorflow/tfjs-node');
const faceapi = require('face-api.js');
const { Canvas, Image, ImageData } = require('canvas');

class BiometricService {
  constructor() {
    this.faceMatcher = null;
    this.livenessThreshold = 0.8;
    this.faceDetectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
  }

  async initialize() {
    try {
      await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
      await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
      await faceapi.nets.faceRecognitionNet.loadFromDisk('./models');
      await faceapi.nets.faceExpressionNet.loadFromDisk('./models');
      console.log('Biometric models loaded successfully');
    } catch (error) {
      console.error('Error loading biometric models:', error);
      throw error;
    }
  }

  async verifyLiveness(imageData) {
    try {
      const img = await this.loadImage(imageData);
      const canvas = new Canvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Detect face landmarks
      const detections = await faceapi.detectAllFaces(canvas, this.faceDetectionOptions)
        .withFaceLandmarks();

      if (detections.length === 0) {
        throw new Error('No face detected');
      }

      // Analyze facial expressions
      const expressions = await faceapi.detectFaceExpressions(canvas);
      
      // Check for natural facial movements
      const livenessScore = this.calculateLivenessScore(expressions);
      
      return {
        isLive: livenessScore >= this.livenessThreshold,
        score: livenessScore,
        expressions: expressions[0]?.expressions
      };
    } catch (error) {
      console.error('Liveness verification failed:', error);
      throw error;
    }
  }

  calculateLivenessScore(expressions) {
    if (!expressions || expressions.length === 0) return 0;

    const expression = expressions[0].expressions;
    const naturalExpressions = ['happy', 'neutral', 'sad', 'angry', 'surprised', 'disgusted', 'fearful'];
    
    // Calculate score based on natural expression presence
    const score = naturalExpressions.reduce((total, exp) => {
      return total + (expression[exp] || 0);
    }, 0) / naturalExpressions.length;

    return score;
  }

  async verifyBiometrics(imageData, studentId) {
    try {
      // Verify liveness first
      const livenessResult = await this.verifyLiveness(imageData);
      
      if (!livenessResult.isLive) {
        throw new Error('Liveness check failed');
      }

      // Perform face recognition
      const recognitionResult = await this.verifyFace(imageData, studentId);
      
      return {
        verified: recognitionResult.verified,
        confidence: recognitionResult.confidence,
        liveness: livenessResult,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Biometric verification failed:', error);
      throw error;
    }
  }

  async verifyFace(imageData, studentId) {
    try {
      const img = await this.loadImage(imageData);
      const canvas = new Canvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Detect and recognize face
      const detections = await faceapi.detectAllFaces(canvas, this.faceDetectionOptions)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        throw new Error('No face detected');
      }

      // Match with stored descriptor
      const descriptor = detections[0].descriptor;
      const match = await this.faceMatcher.findBestMatch(descriptor);

      return {
        verified: match.label === studentId && match.distance < 0.6,
        confidence: 1 - match.distance,
        distance: match.distance
      };
    } catch (error) {
      console.error('Face verification failed:', error);
      throw error;
    }
  }

  async loadImage(imageData) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageData;
    });
  }

  setFaceMatcher(matcher) {
    this.faceMatcher = matcher;
  }
}

module.exports = BiometricService; 