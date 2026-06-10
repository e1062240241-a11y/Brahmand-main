"""
Krishna Personalizer Utility

Handles session detection, profile extraction (mood, concern, tone),
dynamic persona mapping, and past conversation summarization.
"""
import os
import json
import logging
from datetime import datetime, timezone
import google.genai as genai
from google.genai import types

logger = logging.getLogger(__name__)

def _get_gemini_client():
    gemini_key = os.environ.get("GEMINI_API_KEY")
    # genai.Client will automatically use GOOGLE_APPLICATION_CREDENTIALS if api_key is None
    return genai.Client(api_key=gemini_key)

def check_session_boundary(last_updated_str: str, session_threshold_seconds: int = 900) -> bool:
    """
    Checks if a new session should start based on the time elapsed since the last message.
    Threshold default: 15 minutes (900 seconds).
    """
    if not last_updated_str:
        return True
        
    try:
        # Parse ISO string
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
    Extracts the user's Spiritual-Psychological Profile from user_message and optional chat_history.
    Returns a dict with: { "mood": "...", "focus_area": "...", "persona": "..." }
    """
    client = _get_gemini_client()
    
    # Build a context from history if available
    history_text = ""
    if chat_history:
        history_text = "\n".join([f"{msg.get('role', 'user')}: {msg.get('content', '')}" for msg in chat_history[-6:]])
    
    prompt = f"""
    Analyze the following user input (and recent history if available) to extract three key attributes for our spiritual chatbot personalization engine:
    1. mood (Emotional Baseline, e.g., Anxious, Motivated, Confused, Curious, Lonely, Sad, Neutral)
    2. focus_area (Core Concern, e.g., Career, Relationship, Self-doubt, Academic, Family, Purpose, Health, General)
    3. persona (Tone Preference: 'Casual', 'Direct', 'Philosophical', or 'Warm')

    User message: "{user_message}"
    Recent Chat History:
    {history_text}

    You MUST output ONLY a valid JSON object matching this schema:
    {{
      "mood": "Emotional baseline of the user",
      "focus_area": "Main area of concern or topic they are asking about",
      "persona": "Preferred tone or persona style (either Casual, Direct, Philosophical, or Warm)"
    }}
    """
    
    try:
        import asyncio
        # Run in thread since SDK is sync
        def _call():
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
                max_output_tokens=300
            )
            response = client.models.generate_content(
                model="gemma-2-27b-it",
                contents=prompt,
                config=config
            )
            return response.text
            
        res_text = await asyncio.to_thread(_call)
        profile = json.loads(res_text.strip())
        
        # Ensure keys are present and default if not
        validated_profile = {
            "mood": str(profile.get("mood", "Neutral")).strip(),
            "focus_area": str(profile.get("focus_area", "General")).strip(),
            "persona": str(profile.get("persona", "Philosophical")).strip()
        }
        return validated_profile
    except Exception as e:
        logger.error(f"Failed to extract user profile: {e}")
        # Default fallback
        return {
            "mood": "Neutral",
            "focus_area": "General",
            "persona": "Philosophical"
        }

async def generate_chat_summary(messages: list) -> str:
    """
    Generates a 1-line summary of the chat history.
    """
    if not messages:
        return ""
        
    client = _get_gemini_client()
    
    # Format messages for the summarizer
    chat_text = ""
    for msg in messages[-30:]: # Limit to last 30 messages for summary
        role = "User" if msg.get("role") == "user" else "Krishna"
        content = msg.get("content", "")
        chat_text += f"{role}: {content}\n"
        
    prompt = f"""
    You are a summary assistant for My Krishna chatbot.
    Please summarize the main spiritual/emotional concern of the user and the guidance given in this conversation in exactly one sentence in Hinglish (blend of Hindi and English using Latin letters only).
    
    Strict Rules:
    - Exactly one sentence.
    - Write in Hinglish using A-Z letters only. No Devanagari script.
    
    Conversation:
    {chat_text}
    """
    
    try:
        import asyncio
        def _call():
            config = types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=150
            )
            response = client.models.generate_content(
                model="gemma-2-27b-it",
                contents=prompt,
                config=config
            )
            return response.text
            
        summary = await asyncio.to_thread(_call)
        return summary.strip()
    except Exception as e:
        logger.error(f"Failed to generate chat summary: {e}")
        return ""
