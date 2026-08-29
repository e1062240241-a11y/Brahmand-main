"""
Offensive Content Detection System
Hybrid approach: Regex fallback + ML model (Detoxify)
Supports multilingual (Hindi, English, mix-language)
"""

import re
import os
from typing import Dict, Any

# Try to import detoxify - if not available, use fallback only
try:
    from detoxify import Detoxify
    DETOXIFY_AVAILABLE = True
except ImportError:
    DETOXIFY_AVAILABLE = False
    print("Warning: Detoxify not available, using regex fallback only")

# Leetspeak mapping for normalization
LEET_MAP = {
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
    '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i',
    '+': 't', '#': 'h', '(': 'c', '&': 'a', '9': 'g',
    '|': 'l', '0': 'o', 'vv': 'w', 'vv': 'w'
}

# Hindi offensive words (common Devanagari scripts)
HINDI_OFFENSIVE_WORDS = [
    'गांडू', 'गांडी', 'मादरचोद', 'भड़क', 'बकवास', 'गाली',
    'छिनाल', 'लफंग', 'नालायक', 'निकचod', 'चोद', 'भोंड',
    'वाहन', 'हरामजादा', 'शरारती', 'कमीने', 'मुंडको',
    'घिसल', 'झाड़', 'लौंडा', 'लंडी', 'नपंस'
]

# English offensive words list
ENGLISH_OFFENSIVE_WORDS = [
    'asshole', 'bastard', 'bitch', 'bullshit', 'cock', 'cunt', 
    'damn', 'dick', 'fuck', 'fucker', 'fucking', 'shit', 
    'shity', 'slut', 'whore', 'dumbass', 'idiot', 'moron',
    'retard', 'stupid', 'ugly', 'loser', 'pussy', 'cock',
    'nigga', 'nigger', 'faggot', 'dyke', 'spic', 'chink',
    'gook', 'wetback', 'beaner', 'raghead', 'sandnigger'
]

# Combined word list (lowercase)
BAD_WORDS = set(
    [w.lower() for w in ENGLISH_OFFENSIVE_WORDS] + 
    [w.lower() for w in HINDI_OFFENSIVE_WORDS]
)

# Load ML model once
_model = None

def get_model():
    """Load detoxify model (singleton)"""
    global _model
    if _model is None and DETOXIFY_AVAILABLE:
        try:
            # Use multilingual for Hindi + English support
            model_name = os.getenv('DETOXIFY_MODEL', 'multilingual')
            _model = Detoxify(model_name)
            print(f"Loaded Detoxify model: {model_name}")
        except Exception as e:
            print(f"Failed to load Detoxify: {e}")
            _model = None
    return _model


def normalize_text(text: str) -> str:
    """
    Normalize leetspeak and repeated characters.
    Makes detection more accurate.
    """
    if not text:
        return text
    
    text = text.lower().strip()
    
    # Leetspeak replacement
    normalized = []
    for ch in text:
        normalized.append(LEET_MAP.get(ch, ch))
    text = ''.join(normalized)
    
    # Repeated characters (e.g., 'baaad' -> 'bad')
    text = re.sub(r'(.)\1{2,}', r'\1\1', text)
    
    # Remove special characters but keep Hindi/English
    text = re.sub(r'[^\w\s\u0900-\u097F]', ' ', text)
    
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def regex_check(text: str) -> Dict[str, Any]:
    """
    Fast regex-based check for obvious bad words.
    Returns immediately (no ML delay).
    """
    normalized = normalize_text(text)
    words = normalized.split()
    
    found_bad_words = []
    for word in words:
        # Check partial matches too
        for bad in BAD_WORDS:
            if bad in word or word in bad:
                found_bad_words.append(bad)
                break
    
    if found_bad_words:
        return {
            'offensive': True,
            'method': 'regex',
            'reason': f'Found offensive words: {", ".join(set(found_bad_words))}',
            'confidence': 0.95,
            'categories': {'explicit': 1.0}
        }
    
    return {
        'offensive': False,
        'method': 'regex',
        'confidence': 0.0,
        'categories': {}
    }


def ml_check(text: str, threshold: float = 0.5) -> Dict[str, Any]:
    """
    ML-based check using Detoxify model.
    For doubtful cases after regex check.
    """
    model = get_model()
    
    if model is None:
        return {
            'offensive': False,
            'method': 'ml',
            'error': 'Model not available',
            'confidence': 0.0,
            'categories': {}
        }
    
    try:
        normalized = normalize_text(text)
        results = model.predict(normalized)
        
        # Custom thresholds per category
        toxicity = results.get('toxicity', 0)
        obscene = results.get('obscene', 0)
        severe_toxicity = results.get('severe_toxicity', 0)
        insult = results.get('insult', 0)
        identity_attack = results.get('identity_attack', 0)
        threat = results.get('threat', 0)
        
        # Check against thresholds
        is_offensive = (
            toxicity > threshold or
            obscene > threshold or
            severe_toxicity > 0.3 or  # Always block severe
            insult > threshold or
            identity_attack > threshold
        )
        
        if is_offensive:
            reason_parts = []
            if toxicity > threshold:
                reason_parts.append(f'toxic:{toxicity:.2f}')
            if obscene > threshold:
                reason_parts.append(f'obscene:{obscene:.2f}')
            if insult > threshold:
                reason_parts.append(f'insult:{insult:.2f}')
            if severe_toxicity > 0.3:
                reason_parts.append(f'severe:{severe_toxicity:.2f}')
                
            return {
                'offensive': True,
                'method': 'ml',
                'reason': ', '.join(reason_parts),
                'confidence': max(toxicity, obscene, insult),
                'categories': {
                    'toxicity': toxicity,
                    'obscene': obscene,
                    'severe_toxicity': severe_toxicity,
                    'insult': insult,
                    'identity_attack': identity_attack,
                    'threat': threat
                }
            }
        
        return {
            'offensive': False,
            'method': 'ml',
            'confidence': max(toxicity, obscene, insult),
            'categories': {
                'toxicity': toxicity,
                'obscene': obscene,
                'severe_toxicity': severe_toxicity,
                'insult': insult,
                'identity_attack': identity_attack,
                'threat': threat
            }
        }
        
    except Exception as e:
        print(f"ML check error: {e}")
        return {
            'offensive': False,
            'method': 'ml',
            'error': str(e),
            'confidence': 0.0,
            'categories': {}
        }


def is_offensive(
    text: str,
    use_hybrid: bool = True,
    ml_threshold: float = 0.5,
    skip_regex: bool = False
) -> Dict[str, Any]:
    """
    Main function to check offensive content (Globally disabled).
    """
    return {
        'offensive': False,
        'method': 'none',
        'reason': None,
        'confidence': 0.0,
        'categories': {}
    }


def is_text_safe(text: str, auto_censor: bool = False) -> Dict[str, Any]:
    """
    Higher-level wrapper for chat/comment safety.
    Returns result with optional auto-censor option.
    """
    result = is_offensive(text)
    
    if auto_censor and result['offensive']:
        # Replace bad words with asterisks
        censored = text
        for bad in BAD_WORDS:
            pattern = re.compile(re.escape(bad), re.IGNORECASE)
            censored = pattern.sub('*' * len(bad), censored)
        
        result['censored_text'] = censored
    
    return result


# Test function
def test_offensive_detector():
    """Test cases"""
    test_messages = [
        "Hello everyone!",
        "You are an idiot",
        "मादरचोद क्या बात",
        "I love this beautiful day",
        "u r a p!g",  # leetspeak
        "Great work 👏👍",
        "BSDK क्या यार",
    ]
    
    print("Testing Offensive Detector\n" + "="*50)
    
    for msg in test_messages:
        result = is_offensive(msg)
        print(f"\n📝: {msg}")
        print(f"   Offensive: {result['offensive']}")
        print(f"   Method: {result['method']}")
        print(f"   Reason: {result.get('reason', 'N/A')}")
        if result.get('categories'):
            print(f"   Categories: {result['categories']}")


if __name__ == '__main__':
    test_offensive_detector()