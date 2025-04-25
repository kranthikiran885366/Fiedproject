import { useCallback } from 'react';
import * as faceapi from 'face-api.js';

export const useFaceDetection = (canvasRef) => {
  const loadModels = useCallback(async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]);
      return true;
    } catch (error) {
      console.error('Error loading face detection models:', error);
      return false;
    }
  }, []);

  const detectFace = useCallback(async (imageElement) => {
    try {
      const detections = await faceapi
        .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (!detections.length) {
        return {
          success: false,
          error: 'No face detected'
        };
      }

      return {
        success: true,
        faces: detections.map(detection => ({
          box: detection.detection.box,
          landmarks: detection.landmarks.positions,
          expressions: detection.expressions
        }))
      };
    } catch (error) {
      console.error('Face detection error:', error);
      return {
        success: false,
        error: error.message || 'Face detection failed'
      };
    }
  }, []);

  const drawFaceDetection = useCallback((faces) => {
    if (!canvasRef.current || !faces.length) return;

    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    faces.forEach(face => {
      // Draw face box
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        face.box.x,
        face.box.y,
        face.box.width,
        face.box.height
      );

      // Draw landmarks
      ctx.fillStyle = '#00ff00';
      face.landmarks.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Display dominant expression
      const dominantExpression = Object.entries(face.expressions)
        .reduce((a, b) => (a[1] > b[1] ? a : b))[0];
      
      ctx.font = '16px Arial';
      ctx.fillStyle = '#00ff00';
      ctx.fillText(
        dominantExpression,
        face.box.x,
        face.box.y - 5
      );
    });
  }, [canvasRef]);

  const getFaceDescriptor = useCallback(async (imageElement) => {
    try {
      const detection = await faceapi
        .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return {
          success: false,
          error: 'No face detected'
        };
      }

      return {
        success: true,
        descriptor: detection.descriptor
      };
    } catch (error) {
      console.error('Face descriptor extraction error:', error);
      return {
        success: false,
        error: error.message || 'Failed to extract face descriptor'
      };
    }
  }, []);

  return {
    loadModels,
    detectFace,
    drawFaceDetection,
    getFaceDescriptor
  };
};
