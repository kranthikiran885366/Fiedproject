import * as faceapi from 'face-api.js';
import { toast } from 'react-toastify';

class EmotionAnalysisService {
  constructor() {
    this.isModelLoaded = false;
    this.emotions = ['happy', 'sad', 'angry', 'fearful', 'surprised', 'disgusted', 'neutral'];
    this.sessionData = {
      startTime: null,
      endTime: null,
      emotionHistory: [],
      attentionScores: [],
      engagementMetrics: {}
    };
  }

  async loadModels() {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models')
      ]);
      this.isModelLoaded = true;
      return true;
    } catch (error) {
      console.error('Error loading emotion detection models:', error);
      toast.error('Failed to load emotion detection models');
      return false;
    }
  }

  async detectEmotions(videoElement) {
    if (!this.isModelLoaded) {
      await this.loadModels();
    }

    try {
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detection) {
        const emotions = detection.expressions;
        const timestamp = new Date().getTime();
        
        // Get primary emotion
        const primaryEmotion = Object.entries(emotions).reduce((a, b) => 
          a[1] > b[1] ? a : b
        )[0];

        const emotionData = {
          timestamp,
          primary_emotion: primaryEmotion,
          confidence: emotions[primaryEmotion],
          all_emotions: Object.entries(emotions).map(([emotion, confidence]) => ({
            emotion,
            confidence
          }))
        };

        this.updateSessionData(emotionData);
        return emotionData;
      }
      return null;
    } catch (error) {
      console.error('Error detecting emotions:', error);
      return null;
    }
  }

  startSession() {
    this.sessionData = {
      startTime: new Date().getTime(),
      endTime: null,
      emotionHistory: [],
      attentionScores: [],
      engagementMetrics: {
        totalAttentionSpan: 0,
        averageEngagement: 0,
        emotionDistribution: {},
        distractionCount: 0
      }
    };
  }

  updateSessionData(emotionData) {
    if (!this.sessionData.startTime) {
      this.startSession();
    }

    this.sessionData.emotionHistory.push(emotionData);
    
    // Calculate attention score (0-1)
    const attentionScore = this.calculateAttentionScore(emotionData);
    this.sessionData.attentionScores.push({
      timestamp: emotionData.timestamp,
      score: attentionScore
    });

    // Update emotion distribution
    const emotion = emotionData.primary_emotion;
    this.sessionData.engagementMetrics.emotionDistribution[emotion] = 
      (this.sessionData.engagementMetrics.emotionDistribution[emotion] || 0) + 1;

    // Update engagement metrics
    this.updateEngagementMetrics();
  }

  calculateAttentionScore(emotionData) {
    // Higher scores for positive and neutral emotions, lower for negative
    const attentionWeights = {
      happy: 1.0,
      neutral: 0.8,
      surprised: 0.7,
      sad: 0.4,
      fearful: 0.3,
      disgusted: 0.2,
      angry: 0.1
    };

    return attentionWeights[emotionData.primary_emotion] * emotionData.confidence;
  }

  updateEngagementMetrics() {
    const metrics = this.sessionData.engagementMetrics;
    const history = this.sessionData.emotionHistory;
    const attentionScores = this.sessionData.attentionScores;

    // Calculate average engagement
    metrics.averageEngagement = attentionScores.reduce((sum, score) => 
      sum + score.score, 0) / attentionScores.length;

    // Calculate total attention span (in seconds)
    const attentiveThreshold = 0.6;
    let attentiveSeconds = 0;
    for (let i = 1; i < attentionScores.length; i++) {
      if (attentionScores[i].score >= attentiveThreshold) {
        attentiveSeconds += (attentionScores[i].timestamp - attentionScores[i-1].timestamp) / 1000;
      }
    }
    metrics.totalAttentionSpan = attentiveSeconds;

    // Count distraction instances (sudden drops in attention)
    metrics.distractionCount = 0;
    for (let i = 1; i < attentionScores.length; i++) {
      if (attentionScores[i].score < attentionScores[i-1].score - 0.3) {
        metrics.distractionCount++;
      }
    }
  }

  endSession() {
    if (this.sessionData.startTime) {
      this.sessionData.endTime = new Date().getTime();
      return this.generateSessionReport();
    }
    return null;
  }

  generateSessionReport() {
    const duration = (this.sessionData.endTime - this.sessionData.startTime) / 1000;
    const metrics = this.sessionData.engagementMetrics;
    
    return {
      duration,
      metrics,
      emotionTimeline: this.sessionData.emotionHistory,
      attentionTimeline: this.sessionData.attentionScores,
      summary: {
        attentionSpanPercentage: (metrics.totalAttentionSpan / duration) * 100,
        averageEngagement: metrics.averageEngagement,
        dominantEmotion: Object.entries(metrics.emotionDistribution)
          .reduce((a, b) => a[1] > b[1] ? a : b)[0],
        distractionRate: metrics.distractionCount / (duration / 60) // distractions per minute
      }
    };
  }

  getEmotionHeatmap() {
    const heatmap = {};
    const history = this.sessionData.emotionHistory;
    
    // Group emotions by time intervals (5-second buckets)
    const interval = 5000; // 5 seconds
    history.forEach(entry => {
      const bucket = Math.floor(entry.timestamp / interval) * interval;
      if (!heatmap[bucket]) {
        heatmap[bucket] = {
          emotions: {},
          dominantEmotion: null,
          intensity: 0
        };
      }
      
      entry.all_emotions.forEach(({ emotion, confidence }) => {
        heatmap[bucket].emotions[emotion] = 
          (heatmap[bucket].emotions[emotion] || 0) + confidence;
      });

      // Update dominant emotion and intensity
      const dominant = Object.entries(heatmap[bucket].emotions)
        .reduce((a, b) => a[1] > b[1] ? a : b);
      heatmap[bucket].dominantEmotion = dominant[0];
      heatmap[bucket].intensity = dominant[1];
    });

    return heatmap;
  }
}

export default new EmotionAnalysisService();
