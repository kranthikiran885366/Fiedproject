import axios from 'axios';
import * as tf from '@tensorflow/tfjs';

const API_URL = process.env.REACT_APP_API_URL;

class AnalyticsService {
  constructor() {
    this.predictionModel = null;
    this.initializeModel();
  }

  async initializeModel() {
    try {
      // Load pre-trained model for attendance prediction
      this.predictionModel = await tf.loadLayersModel(
        `${API_URL}/api/analytics/models/attendance-prediction`
      );
    } catch (error) {
      console.error('Error loading prediction model:', error);
    }
  }

  async getClassAnalytics(classId) {
    try {
      const response = await axios.get(
        `${API_URL}/api/analytics/class/${classId}`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching class analytics:', error);
      throw error;
    }
  }

  async predictAttendance(classId, date) {
    try {
      // Get historical data for prediction
      const historicalData = await this.getHistoricalData(classId);
      
      if (!this.predictionModel) {
        await this.initializeModel();
      }

      // Prepare data for prediction
      const inputData = this.prepareDataForPrediction(historicalData);
      
      // Make prediction using TensorFlow.js
      const prediction = await this.predictionModel.predict(inputData).data();
      
      return {
        date,
        predicted: prediction[0],
        confidence: prediction[1]
      };
    } catch (error) {
      console.error('Error predicting attendance:', error);
      throw error;
    }
  }

  async getHistoricalData(classId) {
    try {
      const response = await axios.get(
        `${API_URL}/api/analytics/historical-data/${classId}`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  async generateInsights(classId) {
    try {
      const response = await axios.get(
        `${API_URL}/api/analytics/insights/${classId}`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }

  async getAttendanceTrends(filters) {
    try {
      const response = await axios.get(
        `${API_URL}/api/analytics/trends`,
        {
          params: filters,
          headers: this.getAuthHeader()
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance trends:', error);
      throw error;
    }
  }

  async getEngagementMetrics(classId) {
    try {
      const response = await axios.get(
        `${API_URL}/api/analytics/engagement/${classId}`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching engagement metrics:', error);
      throw error;
    }
  }

  prepareDataForPrediction(historicalData) {
    // Convert historical data to tensor format
    const features = historicalData.map(record => [
      record.dayOfWeek,
      record.timeOfDay,
      record.weatherCondition,
      record.previousAttendance,
      record.holidayFactor
    ]);

    return tf.tensor2d(features);
  }

  async trainModel(trainingData) {
    try {
      const response = await axios.post(
        `${API_URL}/api/analytics/train-model`,
        trainingData,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  }

  async exportAnalytics(filters) {
    try {
      const response = await axios.get(
        `${API_URL}/api/analytics/export`,
        {
          params: filters,
          headers: this.getAuthHeader(),
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance_analytics.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }

  getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}

export default new AnalyticsService();
