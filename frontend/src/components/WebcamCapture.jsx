import React, { useCallback, useRef } from 'react';
import Webcam from 'react-webcam';
import { Box, Button } from '@mui/material';
import { Camera as CameraIcon } from '@mui/icons-material';

const WebcamCapture = ({ onCapture }) => {
  const webcamRef = useRef(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    onCapture(imageSrc);
  }, [onCapture]);

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 500, mx: 'auto' }}>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width="100%"
        videoConstraints={{
          width: 500,
          height: 375,
          facingMode: "user"
        }}
      />
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={capture}
          startIcon={<CameraIcon />}
        >
          Capture Photo
        </Button>
      </Box>
    </Box>
  );
};

export default WebcamCapture; 