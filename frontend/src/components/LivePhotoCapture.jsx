import React, { useRef, useState } from "react";
import axios from "axios";

const LivePhotoCapture = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Start Camera
  const startCamera = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = newStream;
      setStream(newStream);
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  // Capture Photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const imageData = canvasRef.current.toDataURL("image/png");
    setCapturedImage(imageData);
  };

  // Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Submit Data to Backend
  const handleSubmit = async () => {
    if (!capturedImage) {
      alert("Please capture a photo first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post("http://localhost:5000/api/attendance", {
        photo: capturedImage,
        timestamp: new Date().toISOString(),
      });
      alert(response.data.message || "Attendance marked successfully!");
    } catch (error) {
      console.error("Error submitting photo:", error);
      alert("Failed to submit photo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Live Photo Capture for Attendance</h2>

      {/* Video Stream */}
      <div>
        <video ref={videoRef} autoPlay style={{ width: "100%", maxWidth: "400px", border: "2px solid black" }}></video>
      </div>

      {/* Buttons */}
      <div style={{ margin: "10px 0" }}>
        <button onClick={startCamera} style={{ marginRight: "10px" }}>Start Camera</button>
        <button onClick={capturePhoto} disabled={!stream} style={{ marginRight: "10px" }}>Capture Photo</button>
        <button onClick={stopCamera} disabled={!stream}>Stop Camera</button>
      </div>

      {/* Hidden Canvas for Capturing */}
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

      {/* Display Captured Image */}
      {capturedImage && (
        <div>
          <h3>Captured Photo</h3>
          <img src={capturedImage} alt="Captured" style={{ width: "100%", maxWidth: "400px", border: "2px solid black" }} />
        </div>
      )}

      {/* Submit Button */}
      <div style={{ marginTop: "10px" }}>
        <button onClick={handleSubmit} disabled={!capturedImage || isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Attendance"}
        </button>
      </div>
    </div>
  );
};

export default LivePhotoCapture;
