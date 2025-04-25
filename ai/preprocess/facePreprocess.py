import cv2
import numpy as np
import mediapipe as mp
import logging
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional, Union
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PreprocessConfig:
    """Configuration for face preprocessing."""
    target_size: Tuple[int, int] = (224, 224)  # Standard size for many face models
    min_face_size: Tuple[int, int] = (30, 30)
    face_confidence: float = 0.5
    normalize: bool = True
    augment: bool = False
    cache_dir: str = "cache/faces"

class FacePreprocessor:
    def __init__(self, config: Optional[PreprocessConfig] = None):
        """Initialize face preprocessor."""
        self.config = config or PreprocessConfig()
        
        # Initialize MediaPipe Face Detection
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_detector = self.mp_face_detection.FaceDetection(
            min_detection_confidence=self.config.face_confidence
        )
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Create cache directory
        os.makedirs(self.config.cache_dir, exist_ok=True)
        logger.info("Face preprocessor initialized")

    def detect_faces(self, image: np.ndarray) -> List[Dict]:
        """Detect faces in an image and return their bounding boxes."""
        try:
            # Convert to RGB for MediaPipe
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = self.face_detector.process(rgb_image)
            
            faces = []
            if results.detections:
                image_height, image_width, _ = image.shape
                for detection in results.detections:
                    bbox = detection.location_data.relative_bounding_box
                    x = int(bbox.xmin * image_width)
                    y = int(bbox.ymin * image_height)
                    w = int(bbox.width * image_width)
                    h = int(bbox.height * image_height)
                    
                    faces.append({
                        'bbox': (x, y, w, h),
                        'confidence': detection.score[0],
                        'landmarks': self._extract_landmarks(detection, image_width, image_height)
                    })
            
            return faces
            
        except Exception as e:
            logger.error(f"Error detecting faces: {str(e)}")
            return []

    def _extract_landmarks(self, detection, image_width: int, image_height: int) -> Dict:
        """Extract facial landmarks from detection."""
        try:
            landmarks = {}
            keypoints = detection.location_data.relative_keypoints
            
            # Extract key facial points
            landmarks['left_eye'] = (
                int(keypoints[0].x * image_width),
                int(keypoints[0].y * image_height)
            )
            landmarks['right_eye'] = (
                int(keypoints[1].x * image_width),
                int(keypoints[1].y * image_height)
            )
            landmarks['nose_tip'] = (
                int(keypoints[2].x * image_width),
                int(keypoints[2].y * image_height)
            )
            landmarks['mouth_center'] = (
                int(keypoints[3].x * image_width),
                int(keypoints[3].y * image_height)
            )
            
            return landmarks
            
        except Exception as e:
            logger.error(f"Error extracting landmarks: {str(e)}")
            return {}

    def align_face(self, image: np.ndarray, landmarks: Dict) -> np.ndarray:
        """Align face based on eye positions."""
        try:
            left_eye = landmarks['left_eye']
            right_eye = landmarks['right_eye']
            
            # Calculate angle to align eyes horizontally
            dY = right_eye[1] - left_eye[1]
            dX = right_eye[0] - left_eye[0]
            angle = np.degrees(np.arctan2(dY, dX))
            
            # Get the center point between the eyes
            eye_center = (
                int((left_eye[0] + right_eye[0]) // 2),
                int((left_eye[1] + right_eye[1]) // 2)
            )
            
            # Rotate the image
            M = cv2.getRotationMatrix2D(eye_center, angle, 1.0)
            aligned = cv2.warpAffine(
                image, M, (image.shape[1], image.shape[0]),
                flags=cv2.INTER_CUBIC
            )
            
            return aligned
            
        except Exception as e:
            logger.error(f"Error aligning face: {str(e)}")
            return image

    def extract_face(self, image: np.ndarray, bbox: Tuple[int, int, int, int]) -> np.ndarray:
        """Extract face region from image using bounding box."""
        try:
            x, y, w, h = bbox
            
            # Add margin
            margin = int(0.1 * max(w, h))
            x = max(0, x - margin)
            y = max(0, y - margin)
            w = min(image.shape[1] - x, w + 2 * margin)
            h = min(image.shape[0] - y, h + 2 * margin)
            
            face = image[y:y+h, x:x+w]
            return face
            
        except Exception as e:
            logger.error(f"Error extracting face: {str(e)}")
            return None

    def preprocess_face(self, face_image: np.ndarray) -> np.ndarray:
        """Preprocess face image for model input."""
        try:
            # Resize
            face = cv2.resize(face_image, self.config.target_size)
            
            # Convert to RGB if needed
            if len(face.shape) == 2:
                face = cv2.cvtColor(face, cv2.COLOR_GRAY2RGB)
            
            # Normalize if configured
            if self.config.normalize:
                face = face.astype('float32') / 255.0
            
            return face
            
        except Exception as e:
            logger.error(f"Error preprocessing face: {str(e)}")
            return None

    def augment_face(self, face_image: np.ndarray) -> List[np.ndarray]:
        """Apply data augmentation to face image."""
        try:
            augmented = []
            
            # Original image
            augmented.append(face_image)
            
            # Horizontal flip
            augmented.append(cv2.flip(face_image, 1))
            
            # Rotation
            for angle in [-15, 15]:
                M = cv2.getRotationMatrix2D(
                    (face_image.shape[1] // 2, face_image.shape[0] // 2),
                    angle, 1.0
                )
                rotated = cv2.warpAffine(
                    face_image, M,
                    (face_image.shape[1], face_image.shape[0])
                )
                augmented.append(rotated)
            
            # Brightness adjustment
            for alpha in [0.8, 1.2]:
                adjusted = cv2.convertScaleAbs(face_image, alpha=alpha, beta=0)
                augmented.append(adjusted)
            
            return augmented
            
        except Exception as e:
            logger.error(f"Error augmenting face: {str(e)}")
            return [face_image]

    def process_image(self, image: np.ndarray, align: bool = True,
                     augment: bool = False) -> Dict:
        """Process an image through the complete pipeline."""
        try:
            # Detect faces
            faces = self.detect_faces(image)
            if not faces:
                return {'success': False, 'error': 'No faces detected'}
            
            processed_faces = []
            for face_data in faces:
                # Extract face
                face_image = self.extract_face(image, face_data['bbox'])
                if face_image is None:
                    continue
                
                # Align if requested
                if align and face_data['landmarks']:
                    face_image = self.align_face(face_image, face_data['landmarks'])
                
                # Preprocess
                processed = self.preprocess_face(face_image)
                if processed is None:
                    continue
                
                # Augment if requested
                if augment and self.config.augment:
                    augmented = self.augment_face(processed)
                    processed_faces.extend(augmented)
                else:
                    processed_faces.append(processed)
            
            if not processed_faces:
                return {'success': False, 'error': 'Failed to process faces'}
            
            return {
                'success': True,
                'faces': processed_faces,
                'original_faces': faces
            }
            
        except Exception as e:
            logger.error(f"Error in processing pipeline: {str(e)}")
            return {'success': False, 'error': str(e)}

if __name__ == "__main__":
    try:
        # Initialize preprocessor
        preprocessor = FacePreprocessor()
        
        # Create a dummy image for testing
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        # Process image
        result = preprocessor.process_image(test_image)
        
        if result['success']:
            print(f"Successfully processed {len(result['faces'])} faces")
            print(f"Original face detections: {len(result['original_faces'])}")
        else:
            print(f"Error: {result['error']}")
            
    except Exception as e:
        logger.error(f"Error in main execution: {str(e)}")
