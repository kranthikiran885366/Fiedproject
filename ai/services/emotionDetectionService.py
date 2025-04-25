import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
import logging
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional, Union
import os
from datetime import datetime

# Import local modules
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from preprocess.facePreprocess import FacePreprocessor, PreprocessConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class EmotionDetectionConfig:
    """Configuration for emotion detection service."""
    model_path: str = "models/emotion_detection"
    input_shape: Tuple[int, int, int] = (48, 48, 1)  # Standard size for FER dataset
    num_classes: int = 7
    emotions: List[str] = None
    confidence_threshold: float = 0.5
    use_gpu: bool = True
    batch_size: int = 32

    def __post_init__(self):
        if self.emotions is None:
            self.emotions = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']

class EmotionDetectionService:
    def __init__(self, config: Optional[EmotionDetectionConfig] = None):
        """Initialize emotion detection service."""
        self.config = config or EmotionDetectionConfig()
        
        # Initialize preprocessor
        self.preprocessor = FacePreprocessor(PreprocessConfig(
            target_size=self.config.input_shape[:2],
            normalize=True
        ))
        
        # Initialize model
        self.model = self._build_model()
        
        logger.info("Emotion detection service initialized")

    def _build_model(self) -> models.Model:
        """Build and compile the emotion detection model."""
        try:
            model = models.Sequential([
                # First Conv Block
                layers.Conv2D(32, (3, 3), padding='same', input_shape=self.config.input_shape),
                layers.BatchNormalization(),
                layers.Activation('relu'),
                layers.Conv2D(32, (3, 3), padding='same'),
                layers.BatchNormalization(),
                layers.Activation('relu'),
                layers.MaxPooling2D(pool_size=(2, 2)),
                layers.Dropout(0.25),

                # Second Conv Block
                layers.Conv2D(64, (3, 3), padding='same'),
                layers.BatchNormalization(),
                layers.Activation('relu'),
                layers.Conv2D(64, (3, 3), padding='same'),
                layers.BatchNormalization(),
                layers.Activation('relu'),
                layers.MaxPooling2D(pool_size=(2, 2)),
                layers.Dropout(0.25),

                # Third Conv Block
                layers.Conv2D(128, (3, 3), padding='same'),
                layers.BatchNormalization(),
                layers.Activation('relu'),
                layers.Conv2D(128, (3, 3), padding='same'),
                layers.BatchNormalization(),
                layers.Activation('relu'),
                layers.MaxPooling2D(pool_size=(2, 2)),
                layers.Dropout(0.25),

                # Flatten and Dense Layers
                layers.Flatten(),
                layers.Dense(1024),
                layers.BatchNormalization(),
                layers.Activation('relu'),
                layers.Dropout(0.5),
                layers.Dense(self.config.num_classes, activation='softmax')
            ])

            model.compile(
                optimizer='adam',
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )

            # Load weights if they exist
            if os.path.exists(self.config.model_path):
                model.load_weights(self.config.model_path)

            return model

        except Exception as e:
            logger.error(f"Error building model: {str(e)}")
            raise

    def preprocess_face(self, face_image: np.ndarray) -> np.ndarray:
        """Preprocess face for emotion detection."""
        try:
            # Convert to grayscale if needed
            if len(face_image.shape) == 3 and face_image.shape[2] == 3:
                face_image = cv2.cvtColor(face_image, cv2.COLOR_RGB2GRAY)
            
            # Resize and normalize
            face = cv2.resize(face_image, self.config.input_shape[:2])
            face = face.astype('float32') / 255.0
            
            # Add channel dimension if needed
            if len(face.shape) == 2:
                face = np.expand_dims(face, axis=-1)
            
            return face
            
        except Exception as e:
            logger.error(f"Error preprocessing face: {str(e)}")
            return None

    def detect_emotion(self, face_image: np.ndarray) -> Dict:
        """Detect emotion in a face image."""
        try:
            # Process face image
            result = self.preprocessor.process_image(face_image, align=True)
            if not result['success'] or not result['faces']:
                return {'success': False, 'error': "No valid face detected"}
            
            # Preprocess face
            face = self.preprocess_face(result['faces'][0])
            if face is None:
                return {'success': False, 'error': "Failed to preprocess face"}
            
            # Add batch dimension
            face = np.expand_dims(face, axis=0)
            
            # Predict emotion
            predictions = self.model.predict(face)[0]
            
            # Get top emotions
            top_indices = np.argsort(predictions)[::-1]
            
            emotions = []
            for idx in top_indices:
                emotion = {
                    'emotion': self.config.emotions[idx],
                    'confidence': float(predictions[idx])
                }
                emotions.append(emotion)
            
            # Get primary emotion
            primary_emotion = emotions[0]
            
            return {
                'success': True,
                'primary_emotion': primary_emotion['emotion'],
                'confidence': primary_emotion['confidence'],
                'all_emotions': emotions,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error detecting emotion: {str(e)}")
            return {'success': False, 'error': str(e)}

    def detect_emotions_batch(self, face_images: List[np.ndarray]) -> List[Dict]:
        """Detect emotions in a batch of face images."""
        try:
            results = []
            batch_faces = []
            
            # Process each face
            for face_image in face_images:
                result = self.preprocessor.process_image(face_image, align=True)
                if result['success'] and result['faces']:
                    face = self.preprocess_face(result['faces'][0])
                    if face is not None:
                        batch_faces.append(face)
                    else:
                        results.append({
                            'success': False,
                            'error': "Failed to preprocess face"
                        })
                else:
                    results.append({
                        'success': False,
                        'error': "No valid face detected"
                    })
            
            if not batch_faces:
                return results
            
            # Convert to numpy array
            batch_faces = np.array(batch_faces)
            
            # Predict emotions
            predictions = self.model.predict(batch_faces, batch_size=self.config.batch_size)
            
            # Process predictions
            for pred in predictions:
                top_indices = np.argsort(pred)[::-1]
                
                emotions = []
                for idx in top_indices:
                    emotion = {
                        'emotion': self.config.emotions[idx],
                        'confidence': float(pred[idx])
                    }
                    emotions.append(emotion)
                
                primary_emotion = emotions[0]
                
                results.append({
                    'success': True,
                    'primary_emotion': primary_emotion['emotion'],
                    'confidence': primary_emotion['confidence'],
                    'all_emotions': emotions,
                    'timestamp': datetime.now().isoformat()
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error in batch emotion detection: {str(e)}")
            return [{'success': False, 'error': str(e)}] * len(face_images)

    def train(self, train_data: Tuple[np.ndarray, np.ndarray],
             validation_data: Optional[Tuple[np.ndarray, np.ndarray]] = None,
             epochs: int = 50) -> Dict:
        """Train the emotion detection model."""
        try:
            X_train, y_train = train_data
            
            # Convert labels to categorical
            y_train = tf.keras.utils.to_categorical(y_train, self.config.num_classes)
            
            if validation_data:
                X_val, y_val = validation_data
                y_val = tf.keras.utils.to_categorical(y_val, self.config.num_classes)
            else:
                validation_data = None
            
            # Train model
            history = self.model.fit(
                X_train, y_train,
                batch_size=self.config.batch_size,
                epochs=epochs,
                validation_data=validation_data,
                validation_split=0.2 if validation_data is None else None
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
        service = EmotionDetectionService()
        
        # Create a dummy face image for testing
        test_image = np.random.randint(0, 255, (48, 48), dtype=np.uint8)
        
        # Test single image detection
        result = service.detect_emotion(test_image)
        print("\nSingle Image Detection Result:", result)
        
        # Test batch detection
        batch_images = [test_image] * 3
        batch_results = service.detect_emotions_batch(batch_images)
        print("\nBatch Detection Results:", batch_results)
        
    except Exception as e:
        logger.error(f"Error in main execution: {str(e)}")
