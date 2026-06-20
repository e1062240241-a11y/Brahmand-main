import os
import json
import logging
from datetime import datetime, timezone
import requests
import base64

logger = logging.getLogger(__name__)

# Provide the Nvidia details
NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY")
INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

def _call_nvidia_api(prompt: str, max_tokens: int = 300, temperature: float = 0.2) -> str:
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Accept": "application/json"
    }

    payload = {
        "model": "google/gemma-4-31b-it",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": 0.95,
        "stream": False,
        "chat_template_kwargs": {"enable_thinking": False},
    }

    response = requests.post(INVOKE_URL, headers=headers, json=payload)
    response.raise_for_status()
    result = response.json()
    return result.get("choices", [{}])[0].get("message", {}).get("content", "")

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
    Extracts the user's Spiritual-Psychological Profile using Nvidia NM API.
    """
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

    You MUST output ONLY a valid JSON object matching this schema without any markdown formatting or code blocks:
    {{
      "mood": "Emotional baseline of the user",
      "focus_area": "Main area of concern or topic they are asking about",
      "persona": "Preferred tone or persona style (either Casual, Direct, Philosophical, or Warm)"
    }}
    """
    
    try:
        import asyncio
        res_text = await asyncio.to_thread(_call_nvidia_api, prompt, 300, 0.2)
        # Clean potential markdown
        if res_text.startswith("```json"):
            res_text = res_text[7:]
        if res_text.endswith("```"):
            res_text = res_text[:-3]
            
        profile = json.loads(res_text.strip())
        
        validated_profile = {
            "mood": str(profile.get("mood", "Neutral")).strip(),
            "focus_area": str(profile.get("focus_area", "General")).strip(),
            "persona": str(profile.get("persona", "Philosophical")).strip()
        }
        return validated_profile
    except Exception as e:
        logger.error(f"Failed to extract user profile via Nvidia API: {e}")
        return {
            "mood": "Neutral",
            "focus_area": "General",
            "persona": "Philosophical"
        }

async def generate_chat_summary(messages: list) -> str:
    """
    Generates a 1-line summary of the chat history using Nvidia NM API.
    """
    if not messages:
        return ""
        
    chat_text = ""
    for msg in messages[-30:]:
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
        summary = await asyncio.to_thread(_call_nvidia_api, prompt, 150, 0.3)
        return summary.strip()
    except Exception as e:
        logger.error(f"Failed to generate chat summary via Nvidia API: {e}")
        return ""
