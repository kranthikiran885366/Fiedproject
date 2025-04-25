import numpy as np
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Union
import os
from datetime import datetime

# Import local modules
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from preprocess.textPreprocess import TextPreprocessor, PreprocessConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class NLPConfig:
    """Configuration for NLP service."""
    sentiment_model: str = "distilbert-base-uncased-finetuned-sst-2-english"
    zero_shot_model: str = "facebook/bart-large-mnli"
    ner_model: str = "dbmdz/bert-large-cased-finetuned-conll03-english"
    qa_model: str = "distilbert-base-cased-distilled-squad"
    cache_dir: str = "models/nlp_cache"
    max_length: int = 512
    batch_size: int = 16
    use_gpu: bool = True
    confidence_threshold: float = 0.5
    custom_labels: List[str] = field(default_factory=list)

class NLPService:
    def __init__(self, config: Optional[NLPConfig] = None):
        """Initialize NLP service."""
        self.config = config or NLPConfig()
        
        # Set device
        self.device = "cuda" if torch.cuda.is_available() and self.config.use_gpu else "cpu"
        
        # Initialize preprocessor
        self.preprocessor = TextPreprocessor()
        
        # Initialize pipelines
        self._initialize_pipelines()
        
        logger.info(f"NLP service initialized on device: {self.device}")

    def _initialize_pipelines(self):
        """Initialize all NLP pipelines."""
        try:
            # Sentiment analysis pipeline
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model=self.config.sentiment_model,
                device=self.device
            )
            
            # Zero-shot classification pipeline
            self.zero_shot_pipeline = pipeline(
                "zero-shot-classification",
                model=self.config.zero_shot_model,
                device=self.device
            )
            
            # Named Entity Recognition pipeline
            self.ner_pipeline = pipeline(
                "ner",
                model=self.config.ner_model,
                device=self.device
            )
            
            # Question Answering pipeline
            self.qa_pipeline = pipeline(
                "question-answering",
                model=self.config.qa_model,
                device=self.device
            )
            
        except Exception as e:
            logger.error(f"Error initializing pipelines: {str(e)}")
            raise

    def analyze_sentiment(self, text: Union[str, List[str]]) -> Dict:
        """Analyze sentiment in text."""
        try:
            # Preprocess text
            prep_result = self.preprocessor.preprocess(text)
            if not prep_result['success']:
                return {'success': False, 'error': "Text preprocessing failed"}
            
            # Convert processed tokens back to text
            if isinstance(text, str):
                processed_text = ' '.join(prep_result['processed_texts'])
                texts = [processed_text]
            else:
                texts = [' '.join(tokens) for tokens in prep_result['processed_texts']]
            
            # Analyze sentiment
            results = self.sentiment_pipeline(texts)
            
            # Format results
            if isinstance(text, str):
                sentiment_result = {
                    'success': True,
                    'sentiment': results[0]['label'],
                    'confidence': results[0]['score'],
                    'timestamp': datetime.now().isoformat()
                }
            else:
                sentiment_result = {
                    'success': True,
                    'results': [
                        {
                            'sentiment': result['label'],
                            'confidence': result['score']
                        }
                        for result in results
                    ],
                    'timestamp': datetime.now().isoformat()
                }
            
            return sentiment_result
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {str(e)}")
            return {'success': False, 'error': str(e)}

    def classify_text(self, text: str, labels: List[str] = None,
                    multi_label: bool = False) -> Dict:
        """Classify text into given categories using zero-shot learning."""
        try:
            # Use custom labels if provided, otherwise use configured ones
            if not labels and not self.config.custom_labels:
                return {'success': False, 'error': "No classification labels provided"}
            
            labels = labels or self.config.custom_labels
            
            # Preprocess text
            prep_result = self.preprocessor.preprocess(text)
            if not prep_result['success']:
                return {'success': False, 'error': "Text preprocessing failed"}
            
            processed_text = ' '.join(prep_result['processed_texts'])
            
            # Perform classification
            result = self.zero_shot_pipeline(
                processed_text,
                labels,
                multi_label=multi_label
            )
            
            # Format results
            classifications = []
            for label, score in zip(result['labels'], result['scores']):
                if score >= self.config.confidence_threshold:
                    classifications.append({
                        'label': label,
                        'confidence': score
                    })
            
            return {
                'success': True,
                'classifications': classifications,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error classifying text: {str(e)}")
            return {'success': False, 'error': str(e)}

    def extract_entities(self, text: str) -> Dict:
        """Extract named entities from text."""
        try:
            # Preprocess text
            prep_result = self.preprocessor.preprocess(text)
            if not prep_result['success']:
                return {'success': False, 'error': "Text preprocessing failed"}
            
            processed_text = ' '.join(prep_result['processed_texts'])
            
            # Extract entities
            entities = self.ner_pipeline(processed_text)
            
            # Group entities by type
            grouped_entities = {}
            for entity in entities:
                entity_type = entity['entity']
                if entity_type not in grouped_entities:
                    grouped_entities[entity_type] = []
                
                grouped_entities[entity_type].append({
                    'text': entity['word'],
                    'confidence': entity['score'],
                    'start': entity['start'],
                    'end': entity['end']
                })
            
            return {
                'success': True,
                'entities': grouped_entities,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error extracting entities: {str(e)}")
            return {'success': False, 'error': str(e)}

    def answer_question(self, question: str, context: str) -> Dict:
        """Answer a question based on the given context."""
        try:
            # Preprocess text
            q_result = self.preprocessor.preprocess(question)
            c_result = self.preprocessor.preprocess(context)
            
            if not q_result['success'] or not c_result['success']:
                return {'success': False, 'error': "Text preprocessing failed"}
            
            processed_question = ' '.join(q_result['processed_texts'])
            processed_context = ' '.join(c_result['processed_texts'])
            
            # Get answer
            result = self.qa_pipeline(
                question=processed_question,
                context=processed_context
            )
            
            return {
                'success': True,
                'answer': result['answer'],
                'confidence': result['score'],
                'start': result['start'],
                'end': result['end'],
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error answering question: {str(e)}")
            return {'success': False, 'error': str(e)}

    def analyze_text_complete(self, text: str) -> Dict:
        """Perform complete text analysis including sentiment, entities, and features."""
        try:
            results = {
                'success': True,
                'timestamp': datetime.now().isoformat()
            }
            
            # Get sentiment
            sentiment = self.analyze_sentiment(text)
            if sentiment['success']:
                results['sentiment'] = sentiment
            
            # Extract entities
            entities = self.extract_entities(text)
            if entities['success']:
                results['entities'] = entities['entities']
            
            # Get text features
            prep_result = self.preprocessor.preprocess(text, extract_features=True)
            if prep_result['success']:
                results['features'] = prep_result['features']
            
            return results
            
        except Exception as e:
            logger.error(f"Error in complete text analysis: {str(e)}")
            return {'success': False, 'error': str(e)}

    def batch_process(self, texts: List[str], analysis_types: List[str]) -> Dict:
        """Process a batch of texts with specified analysis types."""
        try:
            results = []
            
            for text in texts:
                text_result = {'text': text}
                
                if 'sentiment' in analysis_types:
                    sentiment = self.analyze_sentiment(text)
                    if sentiment['success']:
                        text_result['sentiment'] = sentiment
                
                if 'entities' in analysis_types:
                    entities = self.extract_entities(text)
                    if entities['success']:
                        text_result['entities'] = entities['entities']
                
                if 'features' in analysis_types:
                    prep_result = self.preprocessor.preprocess(text, extract_features=True)
                    if prep_result['success']:
                        text_result['features'] = prep_result['features']
                
                results.append(text_result)
            
            return {
                'success': True,
                'results': results,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in batch processing: {str(e)}")
            return {'success': False, 'error': str(e)}

if __name__ == "__main__":
    try:
        # Initialize service
        service = NLPService()
        
        # Test text
        test_text = "I love this product! It works great and the customer service was excellent."
        
        # Test sentiment analysis
        sentiment_result = service.analyze_sentiment(test_text)
        print("\nSentiment Analysis Result:", sentiment_result)
        
        # Test classification
        classification_result = service.classify_text(
            test_text,
            labels=['positive review', 'negative review', 'neutral review']
        )
        print("\nClassification Result:", classification_result)
        
        # Test entity extraction
        entity_result = service.extract_entities(test_text)
        print("\nEntity Extraction Result:", entity_result)
        
        # Test complete analysis
        complete_result = service.analyze_text_complete(test_text)
        print("\nComplete Analysis Result:", complete_result)
        
    except Exception as e:
        logger.error(f"Error in main execution: {str(e)}")
