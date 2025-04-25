import cv2
import numpy as np
import face_recognition
import dlib
import time
import logging
from typing import Tuple, List, Dict, Optional
from dataclasses import dataclass
from collections import deque
import tensorflow as tf
from scipy.spatial import distance
import mediapipe as mp
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class LivenessConfig:
    """Configuration for liveness detection parameters."""
    blink_threshold: float = 0.3
    smile_threshold: float = 0.7
    head_pose_threshold: float = 30.0
    face_distance_min: float = 0.3
    face_distance_max: float = 0.8
    motion_threshold: float = 0.02
    time_window: int = 30  # frames
    min_face_size: int = 100
    confidence_threshold: float = 0.95

class LivenessDetector:
    def __init__(self, config: Optional[LivenessConfig] = None):
        """Initialize the liveness detector with optional custom configuration."""
        self.config = config or LivenessConfig()
        self.face_detector = dlib.get_frontal_face_detector()
        self.landmark_predictor = dlib.shape_predictor('models/shape_predictor_68_face_landmarks.dat')
        self.face_encoder = dlib.face_recognition_model_v1('models/dlib_face_recognition_resnet_model_v1.dat')
        
        # Initialize MediaPipe Face Mesh for 3D face landmarks
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Motion detection
        self.prev_frame = None
        self.motion_history = deque(maxlen=self.config.time_window)
        
        # Expression detection
        self.expression_history = deque(maxlen=self.config.time_window)
        
        # Load anti-spoofing model
        self.load_anti_spoofing_model()
        
        logger.info("Liveness detector initialized successfully")
        
    def load_anti_spoofing_model(self):
        """Load the anti-spoofing model."""
        try:
            model_path = 'models/anti_spoofing_model'
            self.anti_spoofing_model = tf.keras.models.load_model(model_path)
            logger.info("Anti-spoofing model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading anti-spoofing model: {str(e)}")
            self.anti_spoofing_model = None
            
    def detect_liveness(self, frame: np.ndarray) -> Tuple[bool, Dict]:
        """
        Perform comprehensive liveness detection on a frame.
        
        Args:
            frame: Input frame from video stream
            
        Returns:
            Tuple of (is_live, details_dict)
        """
        try:
            # Convert frame to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Detect faces
            face_locations = face_recognition.face_locations(rgb_frame)
            if not face_locations:
                return False, {"error": "No face detected"}
            
            # Get the largest face
            face_location = max(face_locations, key=lambda rect: (rect[2] - rect[0]) * (rect[1] - rect[3]))
            top, right, bottom, left = face_location
            
            # Check face size
            face_size = min(bottom - top, right - left)
            if face_size < self.config.min_face_size:
                return False, {"error": "Face too small"}
            
            # Get face landmarks
            face = dlib.rectangle(left, top, right, bottom)
            landmarks = self.landmark_predictor(rgb_frame, face)
            
            # Perform various liveness checks
            blink_score = self.detect_blink(landmarks)
            smile_score = self.detect_smile(landmarks)
            head_pose = self.detect_head_pose(landmarks)
            texture_score = self.analyze_face_texture(rgb_frame[top:bottom, left:right])
            motion_score = self.detect_motion(frame)
            depth_score = self.estimate_facial_depth(landmarks)
            anti_spoofing_score = self.check_anti_spoofing(rgb_frame[top:bottom, left:right])
            
            # Aggregate all scores
            scores = {
                'blink': blink_score,
                'smile': smile_score,
                'head_pose': head_pose,
                'texture': texture_score,
                'motion': motion_score,
                'depth': depth_score,
                'anti_spoofing': anti_spoofing_score
            }
            
            # Calculate final liveness score
            is_live = all([
                blink_score > self.config.blink_threshold,
                smile_score > self.config.smile_threshold,
                abs(head_pose) < self.config.head_pose_threshold,
                texture_score > self.config.confidence_threshold,
                motion_score > self.config.motion_threshold,
                depth_score > self.config.confidence_threshold,
                anti_spoofing_score > self.config.confidence_threshold
            ])
            
            return is_live, {
                'scores': scores,
                'face_location': face_location,
                'landmarks': self._landmarks_to_list(landmarks)
            }
            
        except Exception as e:
            logger.error(f"Error in liveness detection: {str(e)}")
            return False, {"error": str(e)}
            
    def detect_blink(self, landmarks) -> float:
        """Detect eye blink using facial landmarks."""
        try:
            # Calculate eye aspect ratio (EAR)
            left_eye = self._get_eye_aspect_ratio(landmarks, "left")
            right_eye = self._get_eye_aspect_ratio(landmarks, "right")
            ear = (left_eye + right_eye) / 2.0
            
            return 1.0 - min(1.0, ear / self.config.blink_threshold)
        except Exception as e:
            logger.error(f"Error in blink detection: {str(e)}")
            return 0.0
            
    def detect_smile(self, landmarks) -> float:
        """Detect smile using facial landmarks."""
        try:
            mouth_width = distance.euclidean(
                self._get_landmark_pos(landmarks, 48),
                self._get_landmark_pos(landmarks, 54)
            )
            mouth_height = distance.euclidean(
                self._get_landmark_pos(landmarks, 51),
                self._get_landmark_pos(landmarks, 57)
            )
            
            smile_ratio = mouth_width / mouth_height
            return min(1.0, smile_ratio / self.config.smile_threshold)
        except Exception as e:
            logger.error(f"Error in smile detection: {str(e)}")
            return 0.0
            
    def detect_head_pose(self, landmarks) -> float:
        """Estimate head pose using facial landmarks."""
        try:
            # Get nose bridge and chin points
            nose_bridge = self._get_landmark_pos(landmarks, 27)
            chin = self._get_landmark_pos(landmarks, 8)
            
            # Calculate angle
            angle = np.arctan2(chin[1] - nose_bridge[1], chin[0] - nose_bridge[0])
            return np.degrees(angle)
        except Exception as e:
            logger.error(f"Error in head pose detection: {str(e)}")
            return 0.0
            
    def analyze_face_texture(self, face_region: np.ndarray) -> float:
        """Analyze face texture for anti-spoofing."""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(face_region, cv2.COLOR_RGB2GRAY)
            
            # Apply LBP (Local Binary Pattern)
            lbp = self._local_binary_pattern(gray)
            
            # Calculate histogram of LBP
            hist, _ = np.histogram(lbp.ravel(), bins=np.arange(0, 257))
            hist = hist.astype("float")
            hist /= (hist.sum() + 1e-7)
            
            # Calculate texture score based on histogram uniformity
            return 1.0 - np.sum(hist * np.log2(hist + 1e-7))
        except Exception as e:
            logger.error(f"Error in texture analysis: {str(e)}")
            return 0.0
            
    def detect_motion(self, frame: np.ndarray) -> float:
        """Detect natural head motion."""
        try:
            if self.prev_frame is None:
                self.prev_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                return 0.0
                
            # Convert current frame to grayscale
            curr_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Calculate optical flow
            flow = cv2.calcOpticalFlowFarneback(
                self.prev_frame, curr_frame, None, 0.5, 3, 15, 3, 5, 1.2, 0
            )
            
            # Calculate motion magnitude
            magnitude = np.sqrt(flow[..., 0]**2 + flow[..., 1]**2)
            motion_score = np.mean(magnitude)
            
            # Update motion history
            self.motion_history.append(motion_score)
            
            # Update previous frame
            self.prev_frame = curr_frame
            
            return min(1.0, motion_score / self.config.motion_threshold)
        except Exception as e:
            logger.error(f"Error in motion detection: {str(e)}")
            return 0.0
            
    def estimate_facial_depth(self, landmarks) -> float:
        """Estimate facial depth using 3D landmarks."""
        try:
            # Get key facial points
            left_eye = self._get_landmark_pos(landmarks, 36)
            right_eye = self._get_landmark_pos(landmarks, 45)
            nose_tip = self._get_landmark_pos(landmarks, 30)
            
            # Calculate relative depths
            eye_distance = distance.euclidean(left_eye, right_eye)
            nose_depth = distance.euclidean(
                nose_tip,
                ((left_eye[0] + right_eye[0])/2, (left_eye[1] + right_eye[1])/2)
            )
            
            depth_ratio = nose_depth / eye_distance
            return min(1.0, depth_ratio / self.config.face_distance_max)
        except Exception as e:
            logger.error(f"Error in depth estimation: {str(e)}")
            return 0.0
            
    def check_anti_spoofing(self, face_region: np.ndarray) -> float:
        """Perform anti-spoofing check using deep learning model."""
        try:
            if self.anti_spoofing_model is None:
                return 0.0
                
            # Preprocess image
            face_region = cv2.resize(face_region, (128, 128))
            face_region = face_region.astype('float32') / 255.0
            face_region = np.expand_dims(face_region, axis=0)
            
            # Get prediction
            prediction = self.anti_spoofing_model.predict(face_region)[0][0]
            return float(prediction)
        except Exception as e:
            logger.error(f"Error in anti-spoofing check: {str(e)}")
            return 0.0
            
    def _get_eye_aspect_ratio(self, landmarks, eye_side: str) -> float:
        """Calculate eye aspect ratio."""
        if eye_side == "left":
            points = [36, 37, 38, 39, 40, 41]
        else:
            points = [42, 43, 44, 45, 46, 47]
            
        landmarks_pos = [self._get_landmark_pos(landmarks, i) for i in points]
        
        # Calculate distances
        a = distance.euclidean(landmarks_pos[1], landmarks_pos[5])
        b = distance.euclidean(landmarks_pos[2], landmarks_pos[4])
        c = distance.euclidean(landmarks_pos[0], landmarks_pos[3])
        
        # Calculate EAR
        ear = (a + b) / (2.0 * c)
        return ear
        
    def _get_landmark_pos(self, landmarks, point: int) -> Tuple[float, float]:
        """Get x,y coordinates of a facial landmark."""
        return (landmarks.part(point).x, landmarks.part(point).y)
        
    def _landmarks_to_list(self, landmarks) -> List[Tuple[float, float]]:
        """Convert dlib landmarks to list of coordinates."""
        return [(p.x, p.y) for p in landmarks.parts()]
        
    def _local_binary_pattern(self, image: np.ndarray) -> np.ndarray:
        """Calculate Local Binary Pattern."""
        neighbors = 8
        radius = 1
        lbp = np.zeros_like(image)
        for ih in range(0, image.shape[0] - 2):
            for iw in range(0, image.shape[1] - 2):
                img = image[ih:ih + 3, iw:iw + 3]
                center = img[1, 1]
                pixels = []
                pixels.extend(img[0, :])
                pixels.extend(img[1, [2]])
                pixels.extend(img[2, ::-1])
                pixels.extend(img[1, [0]])
                pixels = np.array(pixels, dtype=np.uint8)
                pattern = np.where(pixels >= center, 1, 0)
                lbp[ih + 1, iw + 1] = np.sum(pattern * (1 << np.arange(8, dtype=np.uint8)))
        return lbp

def start_liveness_detection(camera_index: int = 0, display: bool = True):
    """Start real-time liveness detection."""
    try:
        detector = LivenessDetector()
        cap = cv2.VideoCapture(camera_index)
        logger.info("Starting liveness detection...")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Perform liveness detection
            is_live, details = detector.detect_liveness(frame)
            
            if display:
                # Draw results on frame
                if 'face_location' in details:
                    top, right, bottom, left = details['face_location']
                    color = (0, 255, 0) if is_live else (0, 0, 255)
                    cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
                    
                    # Display scores
                    if 'scores' in details:
                        y_pos = 30
                        for name, score in details['scores'].items():
                            text = f"{name}: {score:.2f}"
                            cv2.putText(frame, text, (10, y_pos),
                                      cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                            y_pos += 25
                            
                cv2.imshow('Liveness Detection', frame)
                
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
        cap.release()
        if display:
            cv2.destroyAllWindows()
            
    except Exception as e:
        logger.error(f"Error in liveness detection: {str(e)}")
        raise

if __name__ == "__main__":
    start_liveness_detection()
