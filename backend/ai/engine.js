const tf = require('@tensorflow/tfjs-node');
const faceapi = require('face-api.js');
const { Canvas, Image, ImageData } = require('canvas');
const config = require('./config');
const logger = require('../utils/logger');

class AIEngine {
  constructor() {
    this.initialized = false;
    this.models = new Map();
    this.cache = new Map();
    this.config = config;
    this.retryCount = 0;
    
    // Initialize face-api.js
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
  }

  async initialize() {
    if (this.initialized) return;

    try {
      logger.info('Initializing AI Engine...');

      // Load TensorFlow backend
      if (this.config.performance.useGPU) {
        await tf.setBackend('tensorflow');
        await tf.ready();
        logger.info('GPU acceleration enabled');
      }

      // Load face detection models with retry mechanism
      await this.loadModelsWithRetry();

      this.initialized = true;
      logger.info('AI Engine initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI Engine:', error);
      throw error;
    }
  }

  async loadModelsWithRetry() {
    while (this.retryCount < this.config.errorHandling.maxRetries) {
      try {
        await Promise.all([
          this.loadModel('ssdMobilenetv1', faceapi.nets.ssdMobilenetv1),
          this.loadModel('faceLandmark68Net', faceapi.nets.faceLandmark68Net),
          this.loadModel('faceRecognitionNet', faceapi.nets.faceRecognitionNet),
          this.loadModel('faceExpressionNet', faceapi.nets.faceExpressionNet),
          this.loadModel('ageGenderNet', faceapi.nets.ageGenderNet)
        ]);
        return;
      } catch (error) {
        this.retryCount++;
        logger.warn(`Model loading attempt ${this.retryCount} failed, retrying...`);
        await new Promise(resolve => 
          setTimeout(resolve, this.config.errorHandling.retryDelay)
        );
      }
    }
    throw new Error('Failed to load models after multiple attempts');
  }

  async loadModel(name, model) {
    const cacheKey = `model_${name}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      logger.info(`Loading model: ${name}`);
      await model.loadFromDisk(this.config.faceRecognition.modelPath);
      this.models.set(name, model);
      
      // Cache the loaded model
      this.cache.set(cacheKey, model);
      
      logger.info(`Model ${name} loaded successfully`);
    } catch (error) {
      logger.error(`Failed to load model ${name}:`, error);
      throw error;
    }
  }

  async detectFace(imageData, options = {}) {
    await this.ensureInitialized();

    const cacheKey = this.generateCacheKey('face_detection', imageData);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const img = await this.preprocessImage(imageData);
      
      const detectionOptions = {
        inputSize: options.inputSize || this.config.faceDetection.inputSize,
        scoreThreshold: options.scoreThreshold || this.config.faceDetection.scoreThreshold
      };

      const detection = await faceapi
        .detectSingleFace(img, new faceapi.SsdMobilenetv1Options(detectionOptions))
        .withFaceLandmarks()
        .withFaceDescriptor()
        .withFaceExpressions()
        .withAgeAndGender();

      if (!detection) {
        throw new Error('No face detected');
      }

      const result = this.postprocessDetection(detection);
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      logger.error('Face detection failed:', error);
      throw error;
    }
  }

  async verifyLiveness(imageData) {
    await this.ensureInitialized();

    try {
      const detection = await this.detectFace(imageData);
      const [livenessScore, antiSpoofingScore] = await Promise.all([
        this.performLivenessChecks(detection),
        this.performAntiSpoofing(imageData, detection)
      ]);

      const qualityScore = await this.assessImageQuality(imageData);

      return {
        isLive: livenessScore >= this.config.livenessDetection.minScore && 
                antiSpoofingScore >= this.config.antiSpoofing.minScore &&
                qualityScore >= this.config.faceQuality.minQualityScore,
        scores: {
          liveness: livenessScore,
          antiSpoofing: antiSpoofingScore,
          quality: qualityScore
        },
        checks: {
          eyesOpen: this.checkEyesOpen(detection.landmarks),
          naturalExpressions: this.checkNaturalExpressions(detection.expressions),
          headPose: this.checkHeadPose(detection.landmarks),
          faceSymmetry: this.checkFaceSymmetry(detection.landmarks),
          quality: {
            brightness: this.assessBrightness(imageData),
            sharpness: this.assessSharpness(imageData),
            contrast: this.assessContrast(imageData),
            resolution: this.assessResolution(imageData)
          }
        }
      };
    } catch (error) {
      logger.error('Liveness verification failed:', error);
      throw error;
    }
  }

  async performAntiSpoofing(imageData, detection) {
    const scores = [];

    // Texture analysis
    if (this.config.antiSpoofing.textureAnalysis) {
      scores.push(await this.analyzeTexture(imageData, detection));
    }

    // Motion analysis
    if (this.config.antiSpoofing.motionAnalysis) {
      scores.push(await this.analyzeMotion(imageData, detection));
    }

    // Depth analysis
    if (this.config.antiSpoofing.depthAnalysis) {
      scores.push(await this.analyzeDepth(imageData, detection));
    }

    return scores.reduce((acc, score) => acc + score, 0) / scores.length;
  }

  async analyzeTexture(imageData, detection) {
    // Implement texture analysis using LBP or similar
    const faceRegion = await this.extractFaceRegion(imageData, detection);
    const textureFeatures = await this.computeTextureFeatures(faceRegion);
    return this.evaluateTextureScore(textureFeatures);
  }

  async analyzeMotion(imageData, detection) {
    // Implement motion analysis
    return 0.95; // Placeholder
  }

  async analyzeDepth(imageData, detection) {
    // Implement depth analysis
    return 0.95; // Placeholder
  }

  async assessImageQuality(imageData) {
    const metrics = await Promise.all([
      this.assessBrightness(imageData),
      this.assessSharpness(imageData),
      this.assessContrast(imageData),
      this.assessResolution(imageData)
    ]);

    return metrics.reduce((acc, score) => acc + score, 0) / metrics.length;
  }

  async assessBrightness(imageData) {
    try {
      const tensor = tf.browser.fromPixels(imageData);
      const mean = tf.mean(tensor);
      const brightness = await mean.data();
      tensor.dispose();
      mean.dispose();

      const normalizedBrightness = brightness[0] / 255;
      return normalizedBrightness >= this.config.faceQuality.minBrightness && 
             normalizedBrightness <= this.config.faceQuality.maxBrightness ? 1 : 0;
    } catch (error) {
      logger.error('Brightness assessment failed:', error);
      return 0;
    }
  }

  async assessSharpness(imageData) {
    try {
      const tensor = tf.browser.fromPixels(imageData);
      const grayscale = tf.mean(tensor, -1);
      const sobelH = tf.conv2d(
        grayscale.expandDims(0).expandDims(-1),
        tf.tensor4d([[-1, -2, -1], [0, 0, 0], [1, 2, 1]]).expandDims(-1).expandDims(-1),
        1,
        'valid'
      );
      const sobelV = tf.conv2d(
        grayscale.expandDims(0).expandDims(-1),
        tf.tensor4d([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]).expandDims(-1).expandDims(-1),
        1,
        'valid'
      );
      const gradientMagnitude = tf.sqrt(tf.add(tf.square(sobelH), tf.square(sobelV)));
      const sharpness = await tf.mean(gradientMagnitude).data();
      
      tensor.dispose();
      grayscale.dispose();
      sobelH.dispose();
      sobelV.dispose();
      gradientMagnitude.dispose();

      return sharpness[0] > this.config.faceQuality.maxBlur ? 1 : 0;
    } catch (error) {
      logger.error('Sharpness assessment failed:', error);
      return 0;
    }
  }

  async assessContrast(imageData) {
    try {
      const tensor = tf.browser.fromPixels(imageData);
      const grayscale = tf.mean(tensor, -1);
      const min = await tf.min(grayscale).data();
      const max = await tf.max(grayscale).data();
      const contrast = (max[0] - min[0]) / 255;
      
      tensor.dispose();
      grayscale.dispose();

      return contrast > 0.5 ? 1 : contrast > 0.3 ? 0.5 : 0;
    } catch (error) {
      logger.error('Contrast assessment failed:', error);
      return 0;
    }
  }

  async assessResolution(imageData) {
    try {
      const { width, height } = imageData;
      const minDimension = Math.min(width, height);
      return minDimension >= this.config.faceQuality.minResolution ? 1 : 0;
    } catch (error) {
      logger.error('Resolution assessment failed:', error);
      return 0;
    }
  }

  checkFaceSymmetry(landmarks) {
    try {
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const nose = landmarks.getNose();
      const mouth = landmarks.getMouth();
      
      // Calculate multiple symmetry metrics
      const eyeSymmetry = this.calculateFeatureSymmetry(leftEye, rightEye, nose[0]);
      const mouthSymmetry = this.calculateFeatureSymmetry(
        mouth.slice(0, mouth.length / 2),
        mouth.slice(mouth.length / 2),
        nose[0]
      );
      
      const symmetryScore = (eyeSymmetry + mouthSymmetry) / 2;
      return symmetryScore > 0.9 ? 1 : symmetryScore > 0.8 ? 0.8 : 0.5;
    } catch (error) {
      logger.error('Face symmetry check failed:', error);
      return 0;
    }
  }

  calculateFeatureSymmetry(leftPoints, rightPoints, centerPoint) {
    const leftDistances = leftPoints.map(p => this.distance(p, centerPoint));
    const rightDistances = rightPoints.map(p => this.distance(p, centerPoint));
    
    const avgLeftDistance = leftDistances.reduce((a, b) => a + b, 0) / leftDistances.length;
    const avgRightDistance = rightDistances.reduce((a, b) => a + b, 0) / rightDistances.length;
    
    return Math.min(avgLeftDistance, avgRightDistance) / Math.max(avgLeftDistance, avgRightDistance);
  }

  generateCacheKey(prefix, data) {
    // Generate a unique cache key based on the data
    return `${prefix}_${this.hashData(data)}`;
  }

  hashData(data) {
    // Implement a simple hashing function
    let hash = 0;
    const str = JSON.stringify(data);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  async cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp && now - value.timestamp > this.config.cache.ttl) {
        this.cache.delete(key);
      }
    }
  }

  async preprocessImage(imageData) {
    try {
      const img = await this.loadImage(imageData);
      
      // Resize image if needed
      if (this.config.imagePreprocessing.targetSize) {
        const { width, height } = this.calculateAspectRatio(
          img.width,
          img.height,
          this.config.imagePreprocessing.targetSize
        );
        return tf.image.resizeBilinear(img, [height, width]);
      }

      return img;
    } catch (error) {
      logger.error('Image preprocessing failed:', error);
      throw error;
    }
  }

  async loadImage(imageData) {
    if (imageData instanceof tf.Tensor) {
      return imageData;
    }
    
    const img = new Image();
    img.src = imageData;
    return img;
  }

  calculateAspectRatio(width, height, targetSize) {
    const ratio = Math.min(targetSize / width, targetSize / height);
    return {
      width: Math.round(width * ratio),
      height: Math.round(height * ratio)
    };
  }

  distance(point1, point2) {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + 
      Math.pow(point2.y - point1.y, 2)
    );
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  clearCache() {
    this.cache.clear();
  }

  postprocessDetection(detection) {
    return {
      descriptor: Array.from(detection.descriptor),
      landmarks: detection.landmarks.positions,
      expressions: detection.expressions,
      age: detection.age,
      gender: detection.gender,
      detection: {
        box: detection.detection.box,
        score: detection.detection.score
      }
    };
  }

  async extractFaceRegion(imageData, detection) {
    // Implement face region extraction
    return imageData;
  }

  async computeTextureFeatures(faceRegion) {
    // Implement texture feature computation
    return [];
  }

  evaluateTextureScore(textureFeatures) {
    // Implement texture score evaluation
    return 0.9;
  }
}

module.exports = new AIEngine();
