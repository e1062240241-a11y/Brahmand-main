"""Application Settings and Configuration"""
import os
from pathlib import Path
from dotenv import load_dotenv
from functools import lru_cache

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')


class Settings:
    """Application settings with environment variable support"""
    
    # Application
    APP_NAME: str = "Sanatan Lok API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # Database
    MONGO_URL: str = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    DB_NAME: str = os.environ.get('DB_NAME', 'sanatan_lok')
    
    # Redis (for caching)
    REDIS_URL: str = os.environ.get('REDIS_URL', 'redis://localhost:6379')
    CACHE_TTL: int = int(os.environ.get('CACHE_TTL', 300))  # 5 minutes default
    
    # JWT Configuration
    JWT_SECRET: str = os.environ['JWT_SECRET']
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 720  # 30 days
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = int(os.environ.get('RATE_LIMIT', 60))
    RATE_LIMIT_AUTH: int = 10  # Auth endpoints
    RATE_LIMIT_MESSAGING: int = 30  # Message sending
    
    # Security
    ENCRYPTION_KEY: str = os.environ['ENCRYPTION_KEY']
    
    # Performance
    MAX_CONNECTIONS: int = int(os.environ.get('MAX_CONNECTIONS', 100))
    WORKER_COUNT: int = int(os.environ.get('WORKER_COUNT', 4))
    
    # WebSocket
    WS_PING_INTERVAL: int = int(os.environ.get('WS_PING_INTERVAL', 25))
    WS_PING_TIMEOUT: int = int(os.environ.get('WS_PING_TIMEOUT', 60))

    # Realtime audio ICE servers
    STUN_URLS: str = os.environ.get(
        'STUN_URLS',
        'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302'
    )
    TURN_URLS: str = os.environ.get('TURN_URLS', '')
    TURN_USERNAME: str = os.environ.get('TURN_USERNAME', '')
    TURN_CREDENTIAL: str = os.environ.get('TURN_CREDENTIAL', '')
    TURN_SHARED_SECRET: str = os.environ.get('TURN_SHARED_SECRET', '')
    TURN_TTL_SECONDS: int = int(os.environ.get('TURN_TTL_SECONDS', 3600))
    LIVEKIT_URL: str = os.environ.get('LIVEKIT_URL', '')
    LIVEKIT_API_KEY: str = os.environ.get('LIVEKIT_API_KEY', '')
    LIVEKIT_API_SECRET: str = os.environ.get('LIVEKIT_API_SECRET', '')
    LIVEKIT_ROOM_PREFIX: str = os.environ.get('LIVEKIT_ROOM_PREFIX', 'jaap')
    LIVEKIT_TOKEN_TTL_SECONDS: int = int(os.environ.get('LIVEKIT_TOKEN_TTL_SECONDS', 3600))
    
    # Agora Configuration
    AGORA_APP_ID: str = os.environ.get('AGORA_APP_ID', '')
    AGORA_APP_CERTIFICATE: str = os.environ.get('AGORA_APP_CERTIFICATE', '')
    AGORA_TOKEN_TTL_SECONDS: int = int(os.environ.get('AGORA_TOKEN_TTL_SECONDS', 3600))
    
    # Logging
    LOG_LEVEL: str = os.environ.get('LOG_LEVEL', 'INFO')

    # Astrology API (astrologyapi.com)
    ASTROLOGY_API_USER_ID: str = os.environ.get('ASTROLOGY_API_USER_ID', '')
    ASTROLOGY_API_TOKEN: str = os.environ.get('ASTROLOGY_API_TOKEN', '')

    # VedicAstroAPI (api.vedicastroapi.com)
    VEDIC_ASTRO_API_KEY: str = os.environ.get('VEDIC_ASTRO_API_KEY', '')
    
    # Prokerala Astrology API
    PROKERALA_CLIENT_ID: str = os.environ.get('PROKERALA_CLIENT_ID', '')
    PROKERALA_CLIENT_SECRET: str = os.environ.get('PROKERALA_CLIENT_SECRET', '')
    PROKERALA_DEFAULT_TZ: str = os.environ.get('PROKERALA_DEFAULT_TZ', 'Asia/Kolkata')
    PROKERALA_SANDBOX_MODE: bool = os.environ.get('PROKERALA_SANDBOX_MODE', 'False').lower() == 'true'
    PROKERALA_MIN_REQUEST_GAP_SECONDS: float = float(os.environ.get('PROKERALA_MIN_REQUEST_GAP_SECONDS', 0.5))
    PROKERALA_MAX_ENDPOINTS_PER_CALL: int = int(os.environ.get('PROKERALA_MAX_ENDPOINTS_PER_CALL', 8))
    PROKERALA_PREFETCH_ENABLED: bool = os.environ.get('PROKERALA_PREFETCH_ENABLED', 'False').lower() == 'true'
    
    GROQ_API_KEY: str = os.environ.get('GROQ_API_KEY', '')

@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
