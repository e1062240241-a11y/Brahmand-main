import os
import json
import logging
from datetime import datetime, timezone
import requests
import base64

logger = logging.getLogger(__name__)



def check_session_boundary(last_updated_str: str, session_threshold_seconds: int = 900) -> bool:
    """
    Checks if a new session should start based on the time elapsed since the last message.
    Threshold default: 15 minutes (900 seconds).
    """
    if not last_updated_str:
        return True
        
    try:
        if last_updated_str.endswith("Z"):
            last_updated_str = last_updated_str[:-1] + "+00:00"
        last_updated = datetime.fromisoformat(last_updated_str)
        now = datetime.now(timezone.utc)
        
        elapsed = (now - last_updated).total_seconds()
        return elapsed > session_threshold_seconds
    except Exception as e:
        logger.error(f"Error checking session boundary: {e}")
        return True

async def extract_user_profile(user_message: str, chat_history: list = None) -> dict:
    """
    Extracts the user's Spiritual-Psychological Profile.
    Returns default balanced profile.
    """
    return {
        "mood": "Neutral",
        "focus_area": "General",
        "persona": "Philosophical"
    }

async def generate_chat_summary(messages: list) -> str:
    """
    Generates a 1-line summary of the chat history.
    Returns empty string fallback when external API is disabled.
    """
    return ""
