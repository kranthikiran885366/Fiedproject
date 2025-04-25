const path = require('path');

module.exports = {
  // Face recognition model settings
  faceRecognition: {
    modelPath: path.join(__dirname, '../models'),
    minConfidence: 0.5,
    distanceThreshold: 0.6,
    batchSize: 32,
    inputSize: 224,
    scoreThreshold: 0.5
  },

  // Face detection settings
  faceDetection: {
    inputSize: 608,
    scoreThreshold: 0.5,
    iouThreshold: 0.5,
    maxResults: 100
  },

  // Face landmark detection settings
  faceLandmarks: {
    scoreThreshold: 0.5,
    inputSize: 192
  },

  // Face expression recognition settings
  faceExpression: {
    minConfidence: 0.7,
    modelSize: 'small'
  },

  // Liveness detection settings
  livenessDetection: {
    minScore: 0.8,
    eyeAspectRatioThreshold: 0.2,
    blinkFrameThreshold: 3,
    expressionChangeThreshold: 0.3,
    headPoseThreshold: 30,
    timeWindow: 3000
  },

  // Image preprocessing settings
  imagePreprocessing: {
    targetSize: 640,
    normalizeInput: true,
    centerCrop: true,
    flipHorizontal: false
  },

  // CCTV processing settings
  cctvProcessing: {
    frameInterval: 1000,
    batchSize: 4,
    detectionInterval: 500,
    trackingTTL: 30000
  },

  // Face quality assessment settings
  faceQuality: {
    minQualityScore: 0.6,
    minResolution: 100,
    maxBlur: 0.5,
    minBrightness: 0.3,
    maxBrightness: 0.7,
    maxPoseAngle: 30,
    minEyeDistance: 50
  },

  // Anti-spoofing settings
  antiSpoofing: {
    minScore: 0.95,
    textureAnalysis: true,
    depthAnalysis: true,
    infraredAnalysis: false,
    motionAnalysis: true
  },

  // Performance optimization settings
  performance: {
    useGPU: true,
    useWASM: true,
    useWebWorkers: true,
    maxConcurrentProcesses: 4
  },

  // Error thresholds and retry settings
  errorHandling: {
    maxRetries: 3,
    retryDelay: 1000,
    timeoutDuration: 10000
  },

  // Model versioning and updates
  modelVersioning: {
    faceDetection: '1.0.0',
    faceLandmarks: '1.0.0',
    faceRecognition: '1.0.0',
    faceExpression: '1.0.0',
    antiSpoofing: '1.0.0'
  },

  // Cache settings
  cache: {
    enabled: true,
    maxSize: 1000,
    ttl: 3600000 // 1 hour
  },

  // Logging and monitoring
  logging: {
    level: 'info',
    enableMetrics: true,
    enableProfiling: false,
    logFilePath: path.join(__dirname, '../logs/ai-engine.log')
  }
};
