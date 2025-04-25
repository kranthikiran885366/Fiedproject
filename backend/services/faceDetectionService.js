const tf = require('@tensorflow/tfjs');
const faceDetection = require('@tensorflow-models/face-detection');

class FaceDetectionService {
  constructor() {
    this.model = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Load the model
      this.model = await faceDetection.createDetector(
        faceDetection.SupportedModels.MediaPipeFaceDetector,
        {
          runtime: 'tfjs',
          modelType: 'short',
          maxFaces: 1
        }
      );
      this.initialized = true;
      console.log('Face detection service initialized');
    } catch (error) {
      console.error('Error initializing face detection:', error);
      this.initialized = false;
    }
  }

  async detectFaces(image) {
    if (!this.initialized) {
      throw new Error('Face detection service not initialized');
    }

    try {
      const faces = await this.model.estimateFaces(image);
      return faces;
    } catch (error) {
      console.error('Error detecting faces:', error);
      throw error;
    }
  }
}

module.exports = new FaceDetectionService(); 