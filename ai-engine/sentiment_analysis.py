from textblob import TextBlob
import logging
from typing import List, Dict, Union
import os

# Create directories if they don't exist
os.makedirs('models', exist_ok=True)
os.makedirs('reports', exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    def __init__(self):
        """Initialize the sentiment analyzer."""
        logger.info("Sentiment analyzer initialized")
        
    def analyze_sentiment(self, text: Union[str, List[str]]) -> Dict:
        """
        Analyze sentiment of input text(s).
        
        Args:
            text: Input text or list of texts
            
        Returns:
            Dictionary containing sentiment scores and predictions
        """
        try:
            # Handle single text or list of texts
            if isinstance(text, str):
                texts = [text]
            else:
                texts = text
                
            results = []
            for t in texts:
                analysis = TextBlob(t)
                polarity = analysis.sentiment.polarity
                subjectivity = analysis.sentiment.subjectivity
                
                # Determine sentiment label
                if polarity > 0.3:
                    label = "positive"
                elif polarity < -0.3:
                    label = "negative"
                else:
                    label = "neutral"
                    
                results.append({
                    'text': t,
                    'label': label,
                    'polarity': float(polarity),
                    'subjectivity': float(subjectivity)
                })
                
            return {
                'sentiments': results[0] if isinstance(text, str) else results,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return {'success': False, 'error': str(e)}
            
    def analyze_sentiment_batch(self, texts: List[str], batch_size: int = 32) -> List[Dict]:
        """Analyze sentiment for a batch of texts."""
        try:
            results = []
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                batch_results = self.analyze_sentiment(batch)
                if batch_results['success']:
                    results.extend(batch_results['sentiments'])
                else:
                    logger.error(f"Error in batch {i}: {batch_results['error']}")
                    
            return results
        except Exception as e:
            logger.error(f"Error in batch sentiment analysis: {str(e)}")
            return []

def create_sample_data() -> List[str]:
    """Create sample data for testing."""
    return [
        "I love this class, the professor is amazing!",
        "This course is terrible, I'm not learning anything.",
        "The lecture was okay, nothing special.",
        "Great examples and clear explanations.",
        "Too much homework and unclear instructions."
    ]

if __name__ == "__main__":
    try:
        # Initialize analyzer
        analyzer = SentimentAnalyzer()
        
        # Test single text analysis
        text = "I really enjoyed today's lecture!"
        result = analyzer.analyze_sentiment(text)
        print("\nSingle Text Analysis:")
        print(f"Text: {text}")
        print(f"Result: {result['sentiments']}")
        
        # Test batch analysis
        texts = create_sample_data()
        print("\nBatch Analysis:")
        results = analyzer.analyze_sentiment_batch(texts)
        for result in results:
            print(f"\nText: {result['text']}")
            print(f"Label: {result['label']}")
            print(f"Polarity: {result['polarity']:.2f}")
            print(f"Subjectivity: {result['subjectivity']:.2f}")
            
    except Exception as e:
        logger.error(f"Error in main execution: {str(e)}")
