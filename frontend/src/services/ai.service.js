import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { loadLayersModel } from '@tensorflow/tfjs';
import axios from 'axios';

class AIService {
  constructor() {
    this.model = null;
    this.detector = null;
    this.livenessModel = null;
    this.sentimentModel = null;
    this.faceEmbeddingModel = null;
    this.initialized = false;
    this.faceDatabase = new Map();
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await tf.ready();
      await tf.setBackend('webgl');
      
      // Initialize face detector
      this.detector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'mediapipe',
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
          refineLandmarks: true,
        }
      );

      // Load custom liveness detection model
      this.livenessModel = await loadLayersModel(
        process.env.REACT_APP_LIVENESS_MODEL_URL
      );

      // Load face embedding model for face verification
      this.faceEmbeddingModel = await loadLayersModel(
        process.env.REACT_APP_FACE_EMBEDDING_MODEL_URL
      );

      // Load sentiment analysis model
      this.sentimentModel = await loadLayersModel(
        process.env.REACT_APP_SENTIMENT_MODEL_URL
      );

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      throw error;
    }
  }

  async detectFaces(imageElement) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const faces = await this.detector.estimateFaces(imageElement, {
        flipHorizontal: false,
        staticImageMode: true,
      });

      if (!faces || faces.length === 0) {
        throw new Error('No faces detected');
      }

      // Enhanced face detection with additional checks
      const enhancedFaces = await Promise.all(faces.map(async face => {
        const { boundingBox, landmarks, probability } = face;
        
        // Check face size
        const faceSize = (boundingBox.width * boundingBox.height) / (imageElement.width * imageElement.height);
        if (faceSize < 0.1) {
          throw new Error('Face too small or too far from camera');
        }

        // Check face orientation
        const pose = this.calculateHeadPose(landmarks);
        if (Math.abs(pose.yaw) > 30 || Math.abs(pose.pitch) > 30) {
          throw new Error('Face not properly aligned with camera');
        }

        // Check image quality
        const quality = await this.assessImageQuality(imageElement, boundingBox);
        if (quality.brightness < 0.3 || quality.sharpness < 0.4) {
          throw new Error('Image quality too low. Please ensure good lighting and clear image');
        }

        // Get face embedding for verification
        const embedding = await this.getFaceEmbedding(imageElement, boundingBox);

        return {
          boundingBox,
          landmarks,
          probability,
          pose,
          quality,
          embedding
        };
      }));

      return enhancedFaces;
    } catch (error) {
      console.error('Face detection failed:', error);
      throw error;
    }
  }

  async verifyFace(face, userId) {
    try {
      // Get stored face embedding for user
      const storedEmbedding = await this.getFaceEmbeddingFromDatabase(userId);
      if (!storedEmbedding) {
        throw new Error('No registered face found for user');
      }

      // Calculate similarity between current and stored face
      const similarity = this.calculateCosineSimilarity(
        face.embedding,
        storedEmbedding
      );

      // Threshold for face verification (adjust based on requirements)
      const threshold = 0.85;
      
      return {
        isMatch: similarity > threshold,
        confidence: similarity,
        threshold
      };
    } catch (error) {
      console.error('Face verification failed:', error);
      throw error;
    }
  }

  async analyzeBehavior(face, imageElement) {
    try {
      // Enhanced behavior analysis
      const attention = this.calculateAttention(face.landmarks);
      const eyeGaze = await this.detectEyeGaze(face.landmarks);
      const emotions = await this.detectEmotions(imageElement);
      const liveness = await this.checkLiveness(imageElement);
      
      // Calculate engagement score
      const engagementScore = this.calculateEngagement(attention, eyeGaze.isLookingAtCamera);

      // Detect suspicious behavior
      const suspicious = this.detectSuspiciousBehavior({
        attention,
        eyeGaze,
        emotions,
        liveness
      });

      return {
        attention: {
          score: attention,
          status: attention > 70 ? 'attentive' : 'distracted'
        },
        eyeGaze: {
          isLookingAtCamera: eyeGaze.isLookingAtCamera,
          direction: eyeGaze.direction
        },
        emotions: {
          primary: emotions.emotion,
          confidence: emotions.confidence
        },
        liveness: {
          isLive: liveness.isLive,
          confidence: liveness.confidence
        },
        engagement: {
          score: engagementScore,
          level: this.getEngagementLevel(engagementScore)
        },
        suspicious: suspicious,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Behavior analysis failed:', error);
      throw error;
    }
  }

  async detectEyeGaze(landmarks) {
    try {
      const leftEye = landmarks[33];
      const rightEye = landmarks[133];
      const nose = landmarks[1];
      
      // Calculate eye vectors
      const leftEyeVector = {
        x: leftEye.x - nose.x,
        y: leftEye.y - nose.y
      };
      
      const rightEyeVector = {
        x: rightEye.x - nose.x,
        y: rightEye.y - nose.y
      };

      // Calculate gaze direction
      const gazeX = (leftEyeVector.x + rightEyeVector.x) / 2;
      const gazeY = (leftEyeVector.y + rightEyeVector.y) / 2;
      
      const direction = this.getGazeDirection(gazeX, gazeY);
      const isLookingAtCamera = direction === 'center';

      return { direction, isLookingAtCamera };
    } catch (error) {
      console.error('Eye gaze detection failed:', error);
      throw error;
    }
  }

  getGazeDirection(x, y) {
    const threshold = 0.1;
    
    if (Math.abs(x) < threshold && Math.abs(y) < threshold) {
      return 'center';
    }
    
    if (Math.abs(x) > Math.abs(y)) {
      return x > 0 ? 'right' : 'left';
    }
    
    return y > 0 ? 'down' : 'up';
  }

  detectSuspiciousBehavior(data) {
    const { attention, eyeGaze, emotions, liveness } = data;
    
    // Define suspicious behavior criteria
    const suspicious = {
      isSpoof: !liveness.isLive,
      lowAttention: attention.score < 50,
      notLookingAtCamera: !eyeGaze.isLookingAtCamera,
      suspiciousEmotion: emotions.primary === 'angry' || emotions.primary === 'fear'
    };

    return {
      ...suspicious,
      isSuspicious: Object.values(suspicious).some(value => value)
    };
  }

  getEngagementLevel(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  calculateCosineSimilarity(embedding1, embedding2) {
    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
    const norm1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const norm2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (norm1 * norm2);
  }

  async assessImageQuality(imageElement, boundingBox) {
    const faceRegion = tf.browser.fromPixels(imageElement)
      .slice([
        Math.floor(boundingBox.top),
        Math.floor(boundingBox.left)
      ], [
        Math.ceil(boundingBox.height),
        Math.ceil(boundingBox.width)
      ]);

    // Calculate brightness
    const brightness = tf.mean(faceRegion).dataSync()[0] / 255;

    // Calculate sharpness using Laplacian variance
    const gray = faceRegion.mean(2);
    const laplacian = this.calculateLaplacian(gray);
    const variance = tf.moments(laplacian).variance.dataSync()[0];
    const sharpness = Math.min(1, variance / 1000);

    faceRegion.dispose();
    gray.dispose();
    laplacian.dispose();

    return { brightness, sharpness };
  }

  calculateLaplacian(image) {
    const kernel = tf.tensor2d([
      [0, 1, 0],
      [1, -4, 1],
      [0, 1, 0]
    ]);
    
    return tf.conv2d(
      image.expandDims(2).expandDims(0),
      kernel.expandDims(2).expandDims(3),
      1,
      'valid'
    ).squeeze();
  }

  calculateHeadPose(landmarks) {
    // Simplified head pose estimation
    const nose = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[133];
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];

    // Calculate yaw (left-right rotation)
    const eyeDistance = Math.abs(rightEye.x - leftEye.x);
    const mouthDistance = Math.abs(rightMouth.x - leftMouth.x);
    const yaw = Math.atan2(eyeDistance - mouthDistance, eyeDistance + mouthDistance) * (180 / Math.PI);

    // Calculate pitch (up-down rotation)
    const eyeMidpoint = {
      y: (leftEye.y + rightEye.y) / 2
    };
    const mouthMidpoint = {
      y: (leftMouth.y + rightMouth.y) / 2
    };
    const pitch = Math.atan2(mouthMidpoint.y - eyeMidpoint.y, nose.y - eyeMidpoint.y) * (180 / Math.PI);

    return { yaw, pitch };
  }

  async getFaceEmbedding(imageElement, boundingBox) {
    const faceRegion = tf.browser.fromPixels(imageElement)
      .slice([
        Math.floor(boundingBox.top),
        Math.floor(boundingBox.left)
      ], [
        Math.ceil(boundingBox.height),
        Math.ceil(boundingBox.width)
      ])
      .resizeBilinear([224, 224])
      .expandDims(0)
      .toFloat()
      .div(255.0);

    const embedding = await this.faceEmbeddingModel.predict(faceRegion).data();
    faceRegion.dispose();

    return Array.from(embedding);
  }

  async getFaceEmbeddingFromDatabase(userId) {
    if (this.faceDatabase.has(userId)) {
      return this.faceDatabase.get(userId);
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/users/${userId}/face-embedding`
      );
      
      const embedding = response.data.embedding;
      this.faceDatabase.set(userId, embedding);
      
      return embedding;
    } catch (error) {
      console.error('Failed to get face embedding from database:', error);
      throw error;
    }
  }

  async detectEmotions(imageElement) {
    // This would require an emotion detection model
    // For now, return a placeholder
    return {
      emotion: 'neutral',
      confidence: 0.8
    };
  }

  async checkLiveness(imageData) {
    try {
      await this.initialize();

      // Preprocess image for liveness detection
      const tensor = tf.browser.fromPixels(imageData)
        .resizeBilinear([224, 224])
        .expandDims()
        .toFloat()
        .div(255.0);

      // Get liveness score
      const prediction = await this.livenessModel.predict(tensor).data();
      tensor.dispose();

      return {
        isLive: prediction[0] > 0.95,
        confidence: prediction[0]
      };
    } catch (error) {
      console.error('Liveness check error:', error);
      throw error;
    }
  }

  async analyzeSentiment(text) {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_AI_ENGINE_URL}/sentiment`,
        { text }
      );
      return response.data;
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      throw error;
    }
  }

  async verifyFaceMatch(image1, image2) {
    try {
      await this.initialize();

      // Detect faces in both images
      const face1 = await this.detectFaces(image1);
      const face2 = await this.detectFaces(image2);

      if (!face1 || !face2) {
        throw new Error('Face not detected in one or both images');
      }

      // Extract face embeddings
      const embedding1 = await this.getFaceEmbedding(image1, face1[0].boundingBox);
      const embedding2 = await this.getFaceEmbedding(image2, face2[0].boundingBox);

      // Calculate cosine similarity
      const similarity = this.calculateCosineSimilarity(embedding1, embedding2);

      return {
        isMatch: similarity > 0.85,
        similarity,
        confidence: similarity
      };
    } catch (error) {
      console.error('Face matching error:', error);
      throw error;
    }
  }

  async detectFraud(attendanceData) {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_AI_ENGINE_URL}/fraud-detection`,
        attendanceData
      );
      return response.data;
    } catch (error) {
      console.error('Fraud detection error:', error);
      throw error;
    }
  }

  async extractFaceEmbedding(face) {
    // Convert face landmarks to embedding vector
    const landmarks = face.landmarks;
    const embedding = tf.tidy(() => {
      const tensor = tf.tensor2d(landmarks);
      return this.faceEmbeddingModel.predict(tensor.expandDims(0)).squeeze();
    });
    return embedding;
  }

  calculateCosineSimilarity(embedding1, embedding2) {
    const similarity = tf.tidy(() => {
      const a = tf.tensor1d(embedding1);
      const b = tf.tensor1d(embedding2);
      const dotProduct = a.dot(b);
      const normA = a.norm();
      const normB = b.norm();
      return dotProduct.div(normA.mul(normB));
    });
    const result = similarity.dataSync()[0];
    similarity.dispose();
    return result;
  }

  dispose() {
    if (this.livenessModel) {
      this.livenessModel.dispose();
    }
    if (this.sentimentModel) {
      this.sentimentModel.dispose();
    }
    this.initialized = false;
  }
}

const aiService = new AIService();
export default aiService;
