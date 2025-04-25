import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np
import cv2
import logging
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class EmotionConfig:
    """Configuration for emotion detection model."""
    model_path: str = "models/emotion_detection"
    input_shape: Tuple[int, int, int] = (48, 48, 1)  # Standard size for emotion detection
    num_classes: int = 7  # angry, disgust, fear, happy, sad, surprise, neutral
    batch_size: int = 32
    emotions: List[str] = None

    def __post_init__(self):
        self.emotions = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']

class EmotionDetectionModel:
    def __init__(self, config: Optional[EmotionConfig] = None):
        """Initialize the emotion detection model."""
        self.config = config or EmotionConfig()
        self.model = self._build_model()
        logger.info("Emotion detection model initialized")

    def _build_model(self) -> models.Model:
        """Build and compile the CNN model for emotion detection."""
        try:
            model = models.Sequential([
                layers.Conv2D(32, (3, 3), activation='relu', input_shape=self.config.input_shape),
                layers.BatchNormalization(),
                layers.MaxPooling2D(2, 2),
                layers.Dropout(0.25),

                layers.Conv2D(64, (3, 3), activation='relu'),
                layers.BatchNormalization(),
                layers.MaxPooling2D(2, 2),
                layers.Dropout(0.25),

                layers.Conv2D(128, (3, 3), activation='relu'),
                layers.BatchNormalization(),
                layers.MaxPooling2D(2, 2),
                layers.Dropout(0.25),

                layers.Flatten(),
                layers.Dense(512, activation='relu'),
                layers.BatchNormalization(),
                layers.Dropout(0.5),
                layers.Dense(self.config.num_classes, activation='softmax')
            ])

            model.compile(
                optimizer='adam',
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )

            return model
        except Exception as e:
            logger.error(f"Error building model: {str(e)}")
            raise

    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for emotion detection."""
        try:
            # Convert to grayscale if needed
            if len(image.shape) == 3:
                image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Resize to expected input size
            image = cv2.resize(image, (self.config.input_shape[0], self.config.input_shape[1]))
            
            # Normalize pixel values
            image = image.astype('float32') / 255.0
            
            # Add channel dimension
            image = np.expand_dims(image, axis=-1)
            
            return image
        except Exception as e:
            logger.error(f"Error preprocessing image: {str(e)}")
            raise

    def detect_emotion(self, face_image: np.ndarray) -> Dict:
        """Detect emotion in a face image."""
        try:
            # Preprocess image
            processed_image = self.preprocess_image(face_image)
            processed_image = np.expand_dims(processed_image, axis=0)

            # Get predictions
            predictions = self.model.predict(processed_image)
            emotion_idx = np.argmax(predictions[0])
            emotion = self.config.emotions[emotion_idx]
            confidence = float(predictions[0][emotion_idx])

            # Get top 3 emotions with probabilities
            top_3_idx = np.argsort(predictions[0])[-3:][::-1]
            top_3_emotions = [
                {
                    'emotion': self.config.emotions[idx],
                    'probability': float(predictions[0][idx])
                }
                for idx in top_3_idx
            ]

            return {
                'primary_emotion': emotion,
                'confidence': confidence,
                'top_3_emotions': top_3_emotions,
                'success': True
            }

        except Exception as e:
            logger.error(f"Error detecting emotion: {str(e)}")
            return {'success': False, 'error': str(e)}

    def train(self, train_data: Tuple[np.ndarray, np.ndarray],
             val_data: Optional[Tuple[np.ndarray, np.ndarray]] = None,
             epochs: int = 50,
             callbacks: List = None):
        """Train the emotion detection model."""
        try:
            X_train, y_train = train_data
            validation_data = val_data if val_data else None

            history = self.model.fit(
                X_train, y_train,
                batch_size=self.config.batch_size,
                epochs=epochs,
                validation_data=validation_data,
                callbacks=callbacks
            )

            return history

        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise

    def evaluate(self, test_data: Tuple[np.ndarray, np.ndarray]) -> Dict:
        """Evaluate the model on test data."""
        try:
            X_test, y_test = test_data
            scores = self.model.evaluate(X_test, y_test, verbose=0)
            
            return {
                'loss': float(scores[0]),
                'accuracy': float(scores[1])
            }

        except Exception as e:
            logger.error(f"Error evaluating model: {str(e)}")
            return {'error': str(e)}

    def save_model(self, path: str = None):
        """Save the model weights."""
        try:
            save_path = path or self.config.model_path
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            self.model.save(save_path)
            logger.info(f"Model saved to {save_path}")

        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise

    def load_model(self, path: str = None):
        """Load the model weights."""
        try:
            load_path = path or self.config.model_path
            self.model = models.load_model(load_path)
            logger.info(f"Model loaded from {load_path}")

        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise

if __name__ == "__main__":
    # Test the emotion detection model
    try:
        # Initialize model
        model = EmotionDetectionModel()
        
        # Create a dummy face image for testing
        dummy_image = np.random.rand(64, 64, 1)
        
        # Test emotion detection
        result = model.detect_emotion(dummy_image)
        
        if result['success']:
            print("\nEmotion Detection Results:")
            print(f"Primary Emotion: {result['primary_emotion']}")
            print(f"Confidence: {result['confidence']:.2f}")
            print("\nTop 3 Emotions:")
            for emotion in result['top_3_emotions']:
                print(f"{emotion['emotion']}: {emotion['probability']:.2f}")
        else:
            print(f"Error: {result['error']}")
            
    except Exception as e:
        logger.error(f"Error in main execution: {str(e)}")
