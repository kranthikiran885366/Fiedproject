const faceapi = require('face-api.js');
const tf = require('@tensorflow/tfjs-node');
const FacialData = require('../models/FacialData');
const canvas = require('canvas');
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

class FaceRecognitionService {
  constructor() {
    this.initialized = false;
    this.modelPath = './models';
  }

  async initialize() {
    if (!this.initialized) {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(this.modelPath),
        faceapi.nets.faceLandmark68Net.loadFromDisk(this.modelPath),
        faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelPath),
        faceapi.nets.faceExpressionNet.loadFromDisk(this.modelPath),
        faceapi.nets.ageGenderNet.loadFromDisk(this.modelPath)
      ]);
      this.initialized = true;
    }
  }

  async detectFace(imageBuffer) {
    try {
      await this.initialize();

      const img = await canvas.loadImage(imageBuffer);
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor()
        .withFaceExpressions()
        .withAgeAndGender();

      if (!detections) {
        throw new Error('No face detected');
      }

      return {
        descriptor: Array.from(detections.descriptor),
        landmarks: detections.landmarks.positions,
        expressions: detections.expressions,
        age: detections.age,
        gender: detections.gender,
        detection: {
          box: detections.detection.box,
          score: detections.detection.score
        }
      };
    } catch (error) {
      throw new Error(`Face detection failed: ${error.message}`);
    }
  }

  async verifyLiveness(imageBuffer) {
    try {
      await this.initialize();

      const img = await canvas.loadImage(imageBuffer);
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceExpressions();

      if (!detections) {
        throw new Error('No face detected for liveness check');
      }

      // Perform liveness checks
      const livenessScore = await this.performLivenessChecks(detections);

      return {
        isLive: livenessScore > 0.8,
        score: livenessScore,
        details: {
          eyesOpen: this.checkEyesOpen(detections.landmarks),
          naturalExpressions: this.checkNaturalExpressions(detections.expressions),
          faceAlignment: this.checkFaceAlignment(detections.landmarks)
        }
      };
    } catch (error) {
      throw new Error(`Liveness verification failed: ${error.message}`);
    }
  }

  async compareFaces(faceDescriptor1, faceDescriptor2) {
    try {
      const distance = faceapi.euclideanDistance(
        faceDescriptor1,
        faceDescriptor2
      );
      const similarity = 1 - distance;
      
      return {
        match: similarity > 0.6,
        similarity,
        distance
      };
    } catch (error) {
      throw new Error(`Face comparison failed: ${error.message}`);
    }
  }

  async enrollFace(userId, imageBuffer) {
    try {
      await this.initialize();

      // Detect face and get descriptor
      const faceData = await this.detectFace(imageBuffer);
      
      // Verify liveness
      const livenessResult = await this.verifyLiveness(imageBuffer);
      if (!livenessResult.isLive) {
        throw new Error('Liveness check failed during enrollment');
      }

      // Create facial data record
      const facialData = new FacialData({
        userId,
        faceDescriptor: faceData.descriptor,
        quality: {
          score: this.calculateQualityScore(faceData),
          factors: {
            lighting: this.assessLighting(faceData),
            pose: this.assessPose(faceData.landmarks),
            resolution: this.assessResolution(imageBuffer),
            occlusion: this.assessOcclusion(faceData)
          }
        },
        metadata: {
          captureMethod: 'webcam',
          captureEnvironment: {
            lightingCondition: this.detectLightingCondition(faceData)
          }
        },
        status: 'active'
      });

      await facialData.save();
      return facialData;
    } catch (error) {
      throw new Error(`Face enrollment failed: ${error.message}`);
    }
  }

  performLivenessChecks(detections) {
    // Combine multiple liveness indicators
    const eyeScore = this.checkEyesOpen(detections.landmarks);
    const expressionScore = this.checkNaturalExpressions(detections.expressions);
    const alignmentScore = this.checkFaceAlignment(detections.landmarks);
    
    return (eyeScore + expressionScore + alignmentScore) / 3;
  }

  checkEyesOpen(landmarks) {
    // Calculate eye aspect ratio
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    const leftEAR = this.calculateEyeAspectRatio(leftEye);
    const rightEAR = this.calculateEyeAspectRatio(rightEye);
    
    const avgEAR = (leftEAR + rightEAR) / 2;
    return avgEAR > 0.2 ? 1 : 0;
  }

  calculateEyeAspectRatio(eye) {
    // Calculate the eye aspect ratio using the landmark points
    const height = (
      this.distance(eye[1], eye[5]) + 
      this.distance(eye[2], eye[4])
    ) / 2;
    const width = this.distance(eye[0], eye[3]);
    return height / width;
  }

  checkNaturalExpressions(expressions) {
    // Check if expressions seem natural
    const maxExpression = Math.max(...Object.values(expressions));
    const isNeutralDominant = expressions.neutral > 0.5;
    
    return isNeutralDominant ? 1 : maxExpression < 0.8 ? 0.8 : 0.5;
  }

  checkFaceAlignment(landmarks) {
    // Check if face is properly aligned
    const nose = landmarks.getNose();
    const jawline = landmarks.getJawOutline();
    
    // Calculate face tilt
    const tilt = Math.abs(
      Math.atan2(
        jawline[16].y - jawline[0].y,
        jawline[16].x - jawline[0].x
      )
    );
    
    return tilt < 0.3 ? 1 : tilt < 0.5 ? 0.7 : 0.3;
  }

  calculateQualityScore(faceData) {
    const factors = {
      detection: faceData.detection.score,
      lighting: this.assessLighting(faceData),
      pose: this.assessPose(faceData.landmarks),
      expression: this.assessExpression(faceData.expressions)
    };

    return Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;
  }

  assessLighting(faceData) {
    // Implement lighting assessment logic
    return 0.9; // Placeholder
  }

  assessPose(landmarks) {
    // Implement pose assessment logic
    return 0.9; // Placeholder
  }

  assessResolution(imageBuffer) {
    // Implement resolution assessment logic
    return 0.9; // Placeholder
  }

  assessOcclusion(faceData) {
    // Implement occlusion assessment logic
    return 0.9; // Placeholder
  }

  assessExpression(expressions) {
    // Prefer neutral expressions
    return expressions.neutral;
  }

  detectLightingCondition(faceData) {
    // Implement lighting condition detection
    return 'good'; // Placeholder
  }

  distance(point1, point2) {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + 
      Math.pow(point2.y - point1.y, 2)
    );
  }
}

module.exports = new FaceRecognitionService();
