import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.pipeline import Pipeline
from datetime import datetime, timedelta
import joblib
import logging
import warnings
from typing import Dict, List, Tuple, Union, Optional
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AttendancePredictionModel:
    def __init__(self, model_path: str = 'models/attendance_model.joblib'):
        """Initialize the attendance prediction model.
        
        Args:
            model_path: Path to save/load the trained model
        """
        self.model_path = model_path
        self.model = None
        self.scaler = StandardScaler()
        self.feature_importance = None
        
    def preprocess_data(self, data: pd.DataFrame) -> Tuple[pd.DataFrame, Optional[pd.Series]]:
        """Preprocess the input data for training or prediction.
        
        Args:
            data: Input DataFrame containing attendance features
            
        Returns:
            Preprocessed features and labels (if available)
        """
        try:
            # Extract time-based features
            data['day_of_week'] = pd.to_datetime(data['date']).dt.dayofweek
            data['month'] = pd.to_datetime(data['date']).dt.month
            data['is_weekend'] = data['day_of_week'].isin([5, 6]).astype(int)
            
            # Calculate rolling statistics
            data['attendance_7day_avg'] = data.groupby('student_id')['attended'].transform(
                lambda x: x.rolling(7, min_periods=1).mean()
            )
            data['attendance_30day_avg'] = data.groupby('student_id')['attended'].transform(
                lambda x: x.rolling(30, min_periods=1).mean()
            )
            
            # Create features for special events/holidays
            data['is_holiday'] = self._is_holiday(data['date'])
            
            # Select features for model
            features = [
                'hours_studied', 'previous_attendance', 'day_of_week', 'month',
                'is_weekend', 'attendance_7day_avg', 'attendance_30day_avg',
                'is_holiday', 'distance_from_home', 'weather_condition'
            ]
            
            X = data[features]
            y = data['attendance_status'] if 'attendance_status' in data.columns else None
            
            # Handle missing values
            X = X.fillna(X.mean())
            
            # Scale features
            X = pd.DataFrame(self.scaler.fit_transform(X), columns=X.columns)
            
            return X, y
            
        except Exception as e:
            logger.error(f"Error in data preprocessing: {str(e)}")
            raise
            
    def train(self, data: pd.DataFrame, optimize: bool = True) -> Dict:
        """Train the attendance prediction model.
        
        Args:
            data: Training data
            optimize: Whether to perform hyperparameter optimization
            
        Returns:
            Dictionary containing training metrics
        """
        try:
            logger.info("Starting model training...")
            X, y = self.preprocess_data(data)
            
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            if optimize:
                # Define model pipeline
                pipeline = Pipeline([
                    ('classifier', RandomForestClassifier())
                ])
                
                # Define hyperparameter grid
                param_grid = {
                    'classifier__n_estimators': [100, 200, 300],
                    'classifier__max_depth': [10, 20, 30, None],
                    'classifier__min_samples_split': [2, 5, 10],
                    'classifier__min_samples_leaf': [1, 2, 4]
                }
                
                # Perform grid search
                grid_search = GridSearchCV(
                    pipeline, param_grid, cv=5, scoring='f1',
                    n_jobs=-1, verbose=1
                )
                grid_search.fit(X_train, y_train)
                self.model = grid_search.best_estimator_
                logger.info(f"Best parameters: {grid_search.best_params_}")
            else:
                self.model = RandomForestClassifier(n_estimators=200, random_state=42)
                self.model.fit(X_train, y_train)
            
            # Calculate feature importance
            self.feature_importance = dict(zip(X.columns, self.model.named_steps['classifier'].feature_importances_))
            
            # Evaluate model
            y_pred = self.model.predict(X_test)
            metrics = {
                'accuracy': accuracy_score(y_test, y_pred),
                'precision': precision_score(y_test, y_pred),
                'recall': recall_score(y_test, y_pred),
                'f1': f1_score(y_test, y_pred)
            }
            
            # Perform cross-validation
            cv_scores = cross_val_score(self.model, X, y, cv=5, scoring='f1')
            metrics['cv_mean'] = cv_scores.mean()
            metrics['cv_std'] = cv_scores.std()
            
            # Save model
            self.save_model()
            
            # Generate and save training report
            self._generate_training_report(metrics, X_test, y_test, y_pred)
            
            logger.info("Model training completed successfully")
            return metrics
            
        except Exception as e:
            logger.error(f"Error in model training: {str(e)}")
            raise
            
    def predict(self, data: pd.DataFrame) -> np.ndarray:
        """Make attendance predictions for new data.
        
        Args:
            data: Input data for prediction
            
        Returns:
            Array of predicted attendance probabilities
        """
        try:
            if self.model is None:
                self.load_model()
                
            X, _ = self.preprocess_data(data)
            predictions = self.model.predict_proba(X)
            return predictions[:, 1]  # Return probability of attendance
            
        except Exception as e:
            logger.error(f"Error in prediction: {str(e)}")
            raise
            
    def save_model(self):
        """Save the trained model to disk."""
        try:
            joblib.dump(self.model, self.model_path)
            logger.info(f"Model saved to {self.model_path}")
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise
            
    def load_model(self):
        """Load a trained model from disk."""
        try:
            self.model = joblib.load(self.model_path)
            logger.info(f"Model loaded from {self.model_path}")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
            
    def _is_holiday(self, dates: pd.Series) -> pd.Series:
        """Check if given dates are holidays."""
        # Implement holiday detection logic here
        return pd.Series(0, index=dates.index)
        
    def _generate_training_report(self, metrics: Dict, X_test: pd.DataFrame,
                                y_test: pd.Series, y_pred: np.ndarray):
        """Generate and save training report with visualizations."""
        try:
            # Create report directory
            report_dir = 'reports/attendance_model'
            os.makedirs(report_dir, exist_ok=True)
            
            # Plot confusion matrix
            plt.figure(figsize=(8, 6))
            cm = confusion_matrix(y_test, y_pred)
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
            plt.title('Confusion Matrix')
            plt.savefig(f'{report_dir}/confusion_matrix.png')
            plt.close()
            
            # Plot feature importance
            plt.figure(figsize=(10, 6))
            importance_df = pd.DataFrame(
                self.feature_importance.items(),
                columns=['Feature', 'Importance']
            ).sort_values('Importance', ascending=False)
            sns.barplot(x='Importance', y='Feature', data=importance_df)
            plt.title('Feature Importance')
            plt.savefig(f'{report_dir}/feature_importance.png')
            plt.close()
            
            # Save metrics to file
            with open(f'{report_dir}/metrics.txt', 'w') as f:
                for metric, value in metrics.items():
                    f.write(f"{metric}: {value:.4f}\n")
                    
        except Exception as e:
            logger.error(f"Error generating training report: {str(e)}")
            raise

def create_synthetic_data(n_samples: int = 1000) -> pd.DataFrame:
    """Create synthetic data for testing the model.
    
    Args:
        n_samples: Number of samples to generate
        
    Returns:
        DataFrame containing synthetic attendance data
    """
    np.random.seed(42)
    
    # Generate dates
    start_date = datetime.now() - timedelta(days=365)
    dates = [start_date + timedelta(days=x) for x in range(n_samples)]
    
    # Generate student IDs
    student_ids = np.random.randint(1000, 2000, n_samples)
    
    # Generate features
    data = {
        'date': dates,
        'student_id': student_ids,
        'hours_studied': np.random.normal(6, 2, n_samples),
        'previous_attendance': np.random.normal(80, 15, n_samples),
        'distance_from_home': np.random.normal(5, 2, n_samples),
        'weather_condition': np.random.choice(['sunny', 'rainy', 'cloudy'], n_samples),
        'attended': np.random.binomial(1, 0.8, n_samples)
    }
    
    return pd.DataFrame(data)

if __name__ == "__main__":
    # Create synthetic dataset
    data = create_synthetic_data()
    
    # Initialize and train model
    model = AttendancePredictionModel()
    metrics = model.train(data, optimize=True)
    
    # Print training metrics
    print("\nTraining Metrics:")
    for metric, value in metrics.items():
        print(f"{metric}: {value:.4f}")
    
    # Make predictions on new data
    new_data = create_synthetic_data(100)
    predictions = model.predict(new_data)
    print("\nSample Predictions:")
    print(predictions[:5])
