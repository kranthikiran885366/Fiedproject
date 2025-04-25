import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Union
import string
import numpy as np

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
except Exception as e:
    print(f"Warning: Failed to download NLTK data: {str(e)}")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PreprocessConfig:
    """Configuration for text preprocessing."""
    remove_stopwords: bool = True
    remove_punctuation: bool = True
    remove_numbers: bool = True
    lemmatize: bool = True
    lowercase: bool = True
    min_word_length: int = 2
    max_sequence_length: int = 100
    custom_stopwords: List[str] = field(default_factory=list)
    keep_special_chars: List[str] = field(default_factory=lambda: ['@', '#', '$'])

class TextPreprocessor:
    def __init__(self, config: Optional[PreprocessConfig] = None):
        """Initialize text preprocessor."""
        self.config = config or PreprocessConfig()
        self.lemmatizer = WordNetLemmatizer()
        self.stopwords = set(stopwords.words('english'))
        if self.config.custom_stopwords:
            self.stopwords.update(self.config.custom_stopwords)
        logger.info("Text preprocessor initialized")

    def clean_text(self, text: str) -> str:
        """Clean text by removing unwanted characters and patterns."""
        try:
            # Convert to lowercase if configured
            if self.config.lowercase:
                text = text.lower()
            
            # Remove URLs
            text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
            
            # Remove email addresses
            text = re.sub(r'\S+@\S+', '', text)
            
            # Remove numbers if configured
            if self.config.remove_numbers:
                text = re.sub(r'\d+', '', text)
            
            # Remove punctuation if configured
            if self.config.remove_punctuation:
                # Keep special characters if specified
                punct = string.punctuation
                for char in self.config.keep_special_chars:
                    punct = punct.replace(char, '')
                text = text.translate(str.maketrans('', '', punct))
            
            # Remove extra whitespace
            text = ' '.join(text.split())
            
            return text
            
        except Exception as e:
            logger.error(f"Error cleaning text: {str(e)}")
            return text

    def tokenize(self, text: str) -> List[str]:
        """Tokenize text into words."""
        try:
            return word_tokenize(text)
        except Exception as e:
            logger.error(f"Error tokenizing text: {str(e)}")
            return text.split()

    def remove_stopwords(self, tokens: List[str]) -> List[str]:
        """Remove stopwords from token list."""
        try:
            return [token for token in tokens if token.lower() not in self.stopwords]
        except Exception as e:
            logger.error(f"Error removing stopwords: {str(e)}")
            return tokens

    def lemmatize_text(self, tokens: List[str]) -> List[str]:
        """Lemmatize tokens."""
        try:
            return [self.lemmatizer.lemmatize(token) for token in tokens]
        except Exception as e:
            logger.error(f"Error lemmatizing text: {str(e)}")
            return tokens

    def filter_tokens(self, tokens: List[str]) -> List[str]:
        """Filter tokens based on configuration."""
        try:
            filtered = []
            for token in tokens:
                # Check minimum length
                if len(token) < self.config.min_word_length:
                    continue
                    
                # Keep special characters if they're in the token
                if any(char in token for char in self.config.keep_special_chars):
                    filtered.append(token)
                    continue
                    
                # Remove tokens that are just punctuation or numbers
                if self.config.remove_punctuation and all(char in string.punctuation for char in token):
                    continue
                if self.config.remove_numbers and token.isdigit():
                    continue
                    
                filtered.append(token)
                
            return filtered
            
        except Exception as e:
            logger.error(f"Error filtering tokens: {str(e)}")
            return tokens

    def pad_sequence(self, tokens: List[str]) -> List[str]:
        """Pad or truncate token sequence to max_sequence_length."""
        try:
            if len(tokens) > self.config.max_sequence_length:
                return tokens[:self.config.max_sequence_length]
            else:
                return tokens + [''] * (self.config.max_sequence_length - len(tokens))
        except Exception as e:
            logger.error(f"Error padding sequence: {str(e)}")
            return tokens

    def extract_features(self, text: str) -> Dict:
        """Extract text features like length, word count, etc."""
        try:
            features = {
                'char_count': len(text),
                'word_count': len(text.split()),
                'unique_word_count': len(set(text.split())),
                'sentence_count': len(re.split(r'[.!?]+', text)),
                'avg_word_length': np.mean([len(word) for word in text.split()]),
                'special_char_count': sum(1 for char in text if char in self.config.keep_special_chars)
            }
            return features
        except Exception as e:
            logger.error(f"Error extracting features: {str(e)}")
            return {}

    def preprocess(self, text: Union[str, List[str]], extract_features: bool = False) -> Dict:
        """Process text through the complete pipeline."""
        try:
            # Handle single text or list of texts
            if isinstance(text, str):
                texts = [text]
            else:
                texts = text
            
            processed_texts = []
            all_features = []
            
            for t in texts:
                # Clean text
                cleaned = self.clean_text(t)
                
                # Tokenize
                tokens = self.tokenize(cleaned)
                
                # Remove stopwords if configured
                if self.config.remove_stopwords:
                    tokens = self.remove_stopwords(tokens)
                
                # Lemmatize if configured
                if self.config.lemmatize:
                    tokens = self.lemmatize_text(tokens)
                
                # Filter tokens
                tokens = self.filter_tokens(tokens)
                
                # Pad sequence
                tokens = self.pad_sequence(tokens)
                
                # Extract features if requested
                if extract_features:
                    features = self.extract_features(t)
                    all_features.append(features)
                
                processed_texts.append(tokens)
            
            result = {
                'success': True,
                'processed_texts': processed_texts[0] if isinstance(text, str) else processed_texts
            }
            
            if extract_features:
                result['features'] = all_features[0] if isinstance(text, str) else all_features
            
            return result
            
        except Exception as e:
            logger.error(f"Error in preprocessing pipeline: {str(e)}")
            return {'success': False, 'error': str(e)}

if __name__ == "__main__":
    try:
        # Initialize preprocessor
        preprocessor = TextPreprocessor()
        
        # Test texts
        texts = [
            "Hello! This is a test message with @mention and #hashtag.",
            "Another example: testing 123 with some punctuation!!!",
            "URL: https://example.com and email@test.com should be removed."
        ]
        
        # Process texts
        result = preprocessor.preprocess(texts, extract_features=True)
        
        if result['success']:
            print("\nProcessed Texts:")
            for i, tokens in enumerate(result['processed_texts']):
                print(f"\nText {i+1}:")
                print(f"Original: {texts[i]}")
                print(f"Processed: {' '.join(token for token in tokens if token)}")
                print(f"Features: {result['features'][i]}")
        else:
            print(f"Error: {result['error']}")
            
    except Exception as e:
        logger.error(f"Error in main execution: {str(e)}")
