import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
import mediapipe as mp
import logging
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional, Union
import os
import pickle
from datetime import datetime
import json

# Import local modules
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from preprocess.facePreprocess import FacePreprocessor, PreprocessConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class FaceRecognitionConfig:
    """Configuration for face recognition service."""
    model_path: str = "models/face_recognition"
    embeddings_path: str = "models/face_embeddings.pkl"
    database_path: str = "data/face_database.json"
    confidence_threshold: float = 0.85
    input_shape: Tuple[int, int, int] = (224, 224, 3)
    embedding_dim: int = 128
    max_faces_per_user: int = 5
    min_detection_size: Tuple[int, int] = (30, 30)
    use_gpu: bool = True

class FaceRecognitionService:
    def __init__(self, config: Optional[FaceRecognitionConfig] = None):
        """Initialize face recognition service."""
        self.config = config or FaceRecognitionConfig()
        
        # Initialize preprocessor
        self.preprocessor = FacePreprocessor(PreprocessConfig(
            target_size=self.config.input_shape[:2],
            min_face_size=self.config.min_detection_size
        ))
        
        # Initialize model
        self.model = self._build_model()
        
        # Load face database
        self.face_database = self._load_database()
        
        # Load face embeddings if they exist
        self.face_embeddings = self._load_embeddings()
        
        logger.info("Face recognition service initialized")

    def _build_model(self) -> models.Model:
        """Build and compile the face recognition model."""
        try:
            # Base model (you can replace this with a pre-trained model like FaceNet)
            model = models.Sequential([
                layers.Conv2D(32, (3, 3), activation='relu', input_shape=self.config.input_shape),
                layers.BatchNormalization(),
                layers.MaxPooling2D(),
                
                layers.Conv2D(64, (3, 3), activation='relu'),
                layers.BatchNormalization(),
                layers.MaxPooling2D(),
                
                layers.Conv2D(128, (3, 3), activation='relu'),
                layers.BatchNormalization(),
                layers.MaxPooling2D(),
                
                layers.Conv2D(256, (3, 3), activation='relu'),
                layers.BatchNormalization(),
                layers.GlobalAveragePooling2D(),
                
                layers.Dense(512, activation='relu'),
                layers.BatchNormalization(),
                layers.Dropout(0.5),
                
                layers.Dense(self.config.embedding_dim, activation=None),
                layers.Lambda(lambda x: tf.math.l2_normalize(x, axis=1))
            ])
            
            model.compile(
                optimizer='adam',
                loss=tf.keras.losses.CosineSimilarity()
            )
            
            # Load weights if they exist
            if os.path.exists(self.config.model_path):
                model.load_weights(self.config.model_path)
                
            return model
            
        except Exception as e:
            logger.error(f"Error building model: {str(e)}")
            raise

    def _load_database(self) -> Dict:
        """Load face database from file."""
        try:
            if os.path.exists(self.config.database_path):
                with open(self.config.database_path, 'r') as f:
                    return json.load(f)
            return {}
        except Exception as e:
            logger.error(f"Error loading database: {str(e)}")
            return {}

    def _save_database(self):
        """Save face database to file."""
        try:
            os.makedirs(os.path.dirname(self.config.database_path), exist_ok=True)
            with open(self.config.database_path, 'w') as f:
                json.dump(self.face_database, f)
        except Exception as e:
            logger.error(f"Error saving database: {str(e)}")

    def _load_embeddings(self) -> Dict:
        """Load face embeddings from file."""
        try:
            if os.path.exists(self.config.embeddings_path):
                with open(self.config.embeddings_path, 'rb') as f:
                    return pickle.load(f)
            return {}
        except Exception as e:
            logger.error(f"Error loading embeddings: {str(e)}")
            return {}

    def _save_embeddings(self):
        """Save face embeddings to file."""
        try:
            os.makedirs(os.path.dirname(self.config.embeddings_path), exist_ok=True)
            with open(self.config.embeddings_path, 'wb') as f:
                pickle.dump(self.face_embeddings, f)
        except Exception as e:
            logger.error(f"Error saving embeddings: {str(e)}")

    def get_face_embedding(self, face_image: np.ndarray) -> np.ndarray:
        """Generate embedding for a face image."""
        try:
            # Ensure face image is preprocessed
            face = self.preprocessor.preprocess_face(face_image)
            if face is None:
                raise ValueError("Failed to preprocess face")
            
            # Add batch dimension
            face = np.expand_dims(face, axis=0)
            
            # Generate embedding
            embedding = self.model.predict(face)[0]
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating face embedding: {str(e)}")
            return None

    def register_face(self, user_id: str, face_image: np.ndarray,
                     metadata: Dict = None) -> Dict:
        """Register a new face in the database."""
        try:
            # Check if user exists and hasn't exceeded max faces
            if user_id in self.face_database:
                if len(self.face_database[user_id]['faces']) >= self.config.max_faces_per_user:
                    return {
                        'success': False,
                        'error': f"Maximum faces ({self.config.max_faces_per_user}) already registered for user"
                    }
            
            # Process face image
            result = self.preprocessor.process_image(face_image, align=True)
            if not result['success'] or not result['faces']:
                return {'success': False, 'error': "No valid face detected"}
            
            # Generate embedding
            embedding = self.get_face_embedding(result['faces'][0])
            if embedding is None:
                return {'success': False, 'error': "Failed to generate face embedding"}
            
            # Add to database
            face_id = f"{user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            face_data = {
                'face_id': face_id,
                'timestamp': datetime.now().isoformat(),
                'metadata': metadata or {}
            }
            
            if user_id not in self.face_database:
                self.face_database[user_id] = {
                    'user_id': user_id,
                    'faces': []
                }
            
            self.face_database[user_id]['faces'].append(face_data)
            self.face_embeddings[face_id] = embedding
            
            # Save updates
            self._save_database()
            self._save_embeddings()
            
            return {
                'success': True,
                'face_id': face_id,
                'user_id': user_id
            }
            
        except Exception as e:
            logger.error(f"Error registering face: {str(e)}")
            return {'success': False, 'error': str(e)}

    def recognize_face(self, face_image: np.ndarray) -> Dict:
        """Recognize a face from the database."""
        try:
            # Process face image
            result = self.preprocessor.process_image(face_image, align=True)
            if not result['success'] or not result['faces']:
                return {'success': False, 'error': "No valid face detected"}
            
            # Generate embedding
            embedding = self.get_face_embedding(result['faces'][0])
            if embedding is None:
                return {'success': False, 'error': "Failed to generate face embedding"}
            
            # Find closest match
            best_match = None
            best_distance = float('inf')
            
            for face_id, stored_embedding in self.face_embeddings.items():
                distance = np.linalg.norm(embedding - stored_embedding)
                if distance < best_distance:
                    best_distance = distance
                    best_match = face_id
            
            # Check confidence threshold
            confidence = 1 / (1 + best_distance)
            if confidence < self.config.confidence_threshold:
                return {
                    'success': True,
                    'recognized': False,
                    'confidence': confidence
                }
            
            # Get user information
            user_id = best_match.split('_')[0]
            user_data = self.face_database[user_id]
            
            return {
                'success': True,
                'recognized': True,
                'user_id': user_id,
                'face_id': best_match,
                'confidence': confidence,
                'user_data': user_data
            }
            
        except Exception as e:
            logger.error(f"Error recognizing face: {str(e)}")
            return {'success': False, 'error': str(e)}

    def update_face(self, user_id: str, face_id: str,
                   metadata: Dict = None) -> Dict:
        """Update face metadata in the database."""
        try:
            if user_id not in self.face_database:
                return {'success': False, 'error': "User not found"}
            
            face_found = False
            for face in self.face_database[user_id]['faces']:
                if face['face_id'] == face_id:
                    if metadata:
                        face['metadata'].update(metadata)
                    face_found = True
                    break
            
            if not face_found:
                return {'success': False, 'error': "Face not found"}
            
            self._save_database()
            return {'success': True}
            
        except Exception as e:
            logger.error(f"Error updating face: {str(e)}")
            return {'success': False, 'error': str(e)}

    def delete_face(self, user_id: str, face_id: str) -> Dict:
        """Delete a face from the database."""
        try:
            if user_id not in self.face_database:
                return {'success': False, 'error': "User not found"}
            
            faces = self.face_database[user_id]['faces']
            self.face_database[user_id]['faces'] = [
                face for face in faces if face['face_id'] != face_id
            ]
            
            if face_id in self.face_embeddings:
                del self.face_embeddings[face_id]
            
            # Remove user if no faces left
            if not self.face_database[user_id]['faces']:
                del self.face_database[user_id]
            
            self._save_database()
            self._save_embeddings()
            
            return {'success': True}
            
        except Exception as e:
            logger.error(f"Error deleting face: {str(e)}")
            return {'success': False, 'error': str(e)}

    def train(self, train_data: List[Tuple[np.ndarray, str]],
             epochs: int = 10, batch_size: int = 32):
        """Train the face recognition model on new data."""
        try:
            # Prepare training data
            X = []
            y = []
            
            for face_image, user_id in train_data:
                result = self.preprocessor.process_image(face_image, align=True)
                if result['success'] and result['faces']:
                    X.append(result['faces'][0])
                    y.append(user_id)
            
            if not X:
                return {'success': False, 'error': "No valid faces for training"}
            
            X = np.array(X)
            y = np.array(y)
            
            # Train model
            history = self.model.fit(
                X, y,
                batch_size=batch_size,
                epochs=epochs,
                validation_split=0.2
            )
            
            # Save model
            self.model.save_weights(self.config.model_path)
            
            return {
                'success': True,
                'history': history.history
            }
            
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            return {'success': False, 'error': str(e)}

if __name__ == "__main__":
    try:
        # Initialize service
        service = FaceRecognitionService()
        
        # Create a dummy face image for testing
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        # Test registration
        result = service.register_face("test_user", test_image, {"name": "Test User"})
        print("\nRegistration Result:", result)
        
        if result['success']:
            # Test recognition
            recog_result = service.recognize_face(test_image)
            print("\nRecognition Result:", recog_result)
            
            # Test update
            update_result = service.update_face(
                result['user_id'],
                result['face_id'],
                {"status": "active"}
            )
            print("\nUpdate Result:", update_result)
            
            # Test deletion
            delete_result = service.delete_face(
                result['user_id'],
                result['face_id']
            )
            print("\nDeletion Result:", delete_result)
            
    except Exception as e:
        logger.error(f"Error in main execution: {str(e)}")
