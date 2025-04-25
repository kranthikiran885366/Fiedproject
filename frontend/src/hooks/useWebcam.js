import { useState, useCallback, useRef } from 'react';

export const useWebcam = (videoRef, onError) => {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const streamRef = useRef(null);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsWebcamActive(true);
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      if (onError) {
        onError(error.message || 'Failed to access webcam');
      }
      setIsWebcamActive(false);
    }
  }, [videoRef, onError]);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  }, [videoRef]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !isWebcamActive) {
      throw new Error('Webcam is not active');
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    return {
      canvas,
      dataUrl: canvas.toDataURL('image/jpeg'),
      width: canvas.width,
      height: canvas.height
    };
  }, [videoRef, isWebcamActive]);

  return {
    isWebcamActive,
    startWebcam,
    stopWebcam,
    captureFrame
  };
};
