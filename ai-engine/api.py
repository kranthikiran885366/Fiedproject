from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import cv2
import torch
from datetime import datetime
import json
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Automated Attendance AI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load face detection model
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Pydantic models for request/response validation
class EmotionRequest(BaseModel):
    image_data: str
    user_id: str

class EmotionResponse(BaseModel):
    emotions: dict
    dominant_emotion: str
    confidence: float
    timestamp: str

class AttendanceRequest(BaseModel):
    user_id: str
    course_id: str
    timestamp: str
    image_data: str
    location: dict

class LivenessRequest(BaseModel):
    image_data: str
    challenge_type: Optional[str] = None

@app.get("/")
async def root():
    return {"status": "AI Service is running"}

@app.post("/api/emotion-detection", response_model=EmotionResponse)
async def detect_emotions(request: EmotionRequest):
    try:
        # Convert base64 image to numpy array
        image_bytes = np.frombuffer(request.image_data.encode(), np.uint8)
        image = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) == 0:
            raise HTTPException(status_code=400, detail="No face detected")
        
        # For demo purposes, return mock emotion data
        emotions = {
            "happy": 0.8,
            "neutral": 0.15,
            "sad": 0.03,
            "angry": 0.01,
            "surprised": 0.01
        }
        
        return EmotionResponse(
            emotions=emotions,
            dominant_emotion="happy",
            confidence=0.8,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Error in emotion detection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/verify-attendance")
async def verify_attendance(request: AttendanceRequest):
    try:
        # Decode image
        image_bytes = np.frombuffer(request.image_data.encode(), np.uint8)
        image = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) == 0:
            raise HTTPException(status_code=400, detail="No face detected")
        
        # For demo purposes, return mock verification data
        return {
            "verified": True,
            "confidence": 0.95,
            "liveness_score": 0.98,
            "attendance_probability": 0.92,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in attendance verification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/liveness-detection")
async def check_liveness(request: LivenessRequest):
    try:
        # Decode image
        image_bytes = np.frombuffer(request.image_data.encode(), np.uint8)
        image = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) == 0:
            return {
                "is_live": False,
                "score": 0.0,
                "details": "No face detected",
                "timestamp": datetime.now().isoformat()
            }
        
        # For demo purposes, return mock liveness data
        return {
            "is_live": True,
            "score": 0.96,
            "details": "Face movement detected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in liveness detection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-sentiment")
async def analyze_sentiment(text: str):
    try:
        # For demo purposes, return mock sentiment data
        return {
            "sentiment": "positive",
            "polarity": 0.8,
            "subjectivity": 0.6,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict-attendance")
async def predict_attendance(
    user_id: str,
    course_id: str,
    timestamp: str,
    location: dict
):
    try:
        # For demo purposes, return mock prediction data
        return {
            "probability": 0.95,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in attendance prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/model-status")
async def get_model_status():
    try:
        return {
            "face_detection": "loaded",
            "sentiment_analysis": "loaded",
            "attendance_prediction": "loaded",
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting model status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
