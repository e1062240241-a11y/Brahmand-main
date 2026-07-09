"""
Image Processing Service
Handles image compression and resizing using Pillow
"""
import io
import base64
import logging
from PIL import Image

logger = logging.getLogger(__name__)

# Maximum dimension for profile photos
MAX_IMAGE_SIZE = 512
# JPEG quality for compression
JPEG_QUALITY = 85


def compress_base64_image(base64_string: str, max_size: int = MAX_IMAGE_SIZE, quality: int = JPEG_QUALITY) -> str:
    """
    Compress and resize a base64 encoded image.
    
    Args:
        base64_string: Base64 encoded image (with or without data URI prefix)
        max_size: Maximum width/height in pixels
        quality: JPEG compression quality (1-100)
    
    Returns:
        Compressed base64 encoded JPEG image with data URI prefix
    """
    import gc
    try:
        # Remove data URI prefix if present
        if ',' in base64_string:
            base64_data = base64_string.split(',')[1]
        else:
            base64_data = base64_string
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_data)
        del base64_data
        
        # Open image with Pillow using a context manager
        with Image.open(io.BytesIO(image_bytes)) as img:
            # Convert to RGB if necessary (for PNG with transparency)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                try:
                    working_img = img
                    if img.mode == 'P':
                        working_img = img.convert('RGBA')
                    if 'A' in working_img.mode:
                        background.paste(working_img, mask=working_img.split()[-1])
                        image = background
                    else:
                        image = working_img.convert('RGB')
                        background.close()
                    if working_img is not img:
                        working_img.close()
                except Exception as convert_err:
                    background.close()
                    raise convert_err
            elif img.mode != 'RGB':
                image = img.convert('RGB')
            else:
                image = img.copy()

        del image_bytes
        gc.collect()

        try:
            # Calculate new size maintaining aspect ratio using thumbnail (in-place & memory efficient)
            width, height = image.size
            if width > max_size or height > max_size:
                image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                logger.info(f"Resized image from {width}x{height} to {image.width}x{image.height}")
            
            # Compress to JPEG
            output_buffer = io.BytesIO()
            try:
                image.save(output_buffer, format='JPEG', quality=quality, optimize=True)
                compressed_bytes = output_buffer.getvalue()
            finally:
                output_buffer.close()
            
            # Encode back to base64
            compressed_base64 = base64.b64encode(compressed_bytes).decode('utf-8')
            
            return f"data:image/jpeg;base64,{compressed_base64}"
        finally:
            image.close()
            gc.collect()
        
    except Exception as e:
        logger.error(f"Image compression failed: {e}")
        # Return original if compression fails
        return base64_string


def is_valid_image(base64_string: str) -> bool:
    """
    Check if a base64 string is a valid image.
    
    Args:
        base64_string: Base64 encoded image
    
    Returns:
        True if valid image, False otherwise
    """
    try:
        if ',' in base64_string:
            base64_data = base64_string.split(',')[1]
        else:
            base64_data = base64_string
        
        image_bytes = base64.b64decode(base64_data)
        image = Image.open(io.BytesIO(image_bytes))
        image.verify()
        return True
    except Exception:
        return False


def get_image_size(base64_string: str) -> tuple:
    """
    Get the dimensions of a base64 encoded image.
    
    Args:
        base64_string: Base64 encoded image
    
    Returns:
        Tuple of (width, height) or (0, 0) if invalid
    """
    try:
        if ',' in base64_string:
            base64_data = base64_string.split(',')[1]
        else:
            base64_data = base64_string
        
        image_bytes = base64.b64decode(base64_data)
        image = Image.open(io.BytesIO(image_bytes))
        return image.size
    except Exception:
        return (0, 0)


async def validate_id_proof_with_llm(
    base64_string: str,
    expected_id_type: str = None,
    expected_id_number: str = None,
    expected_name: str = None
) -> dict:
    """
    Validate if the uploaded base64 image is a valid government-issued ID card
    and matches the expected type, ID number, and name using Llama 3.2 Vision via OpenRouter.
    """
    import os
    import requests
    import json
    import asyncio
    
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        logger.warning("OPENROUTER_API_KEY is not set. Skipping ID validation.")
        return {"valid": True, "doc_type": "unknown", "reason": "API key not configured"}
        
    try:
        # Extract MIME type and base64 data
        if ',' in base64_string:
            parts = base64_string.split(',', 1)
            base64_data = parts[1]
            header = parts[0]
            if ';base64' in header:
                mime_type = header.split(';')[0].split(':')[1]
            else:
                mime_type = "image/jpeg"
        else:
            base64_data = base64_string
            mime_type = "image/jpeg"
            
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        
        prompt = (
            "You are a strict, professional KYC validation AI. Analyze the image and perform strict content validation.\n\n"
            "Verification Guidelines:\n"
            "1. Document Type: The uploaded document image MUST be a government-issued ID card/document.\n"
        )
        
        if expected_id_type:
            prompt += (
                f"   - Expected Document Type: {expected_id_type.upper()}\n"
                f"   - You MUST strictly verify that the document is of this type. E.g., if expected type is AADHAAR, it must be an Aadhaar Card. If PAN, it must be a PAN Card. If they mismatch (e.g. user uploaded a PAN card but expected type was AADHAAR), mark it as invalid.\n"
            )
            
        if expected_id_number:
            prompt += (
                f"2. ID Number Verification:\n"
                f"   - Expected ID Number: '{expected_id_number}'\n"
                f"   - You MUST verify that the visible ID number on the document matches this expected number. Ignore formatting differences like spaces or hyphens.\n"
                f"   - Aadhaar privacy masking: If the Aadhaar number is partially masked (e.g., only showing last 4 digits like 'XXXX-XXXX-1234' or 'xxxx xxxx 1234'), check if the visible 4 digits match the last 4 digits of the expected ID number. If yes, count it as a match. If the numbers completely mismatch, mark it as invalid.\n"
            )
            
        if expected_name:
            prompt += (
                f"3. Name Verification:\n"
                f"   - Expected Name: '{expected_name}'\n"
                f"   - You MUST check if the name printed on the ID document matches or is a close variation of this expected name. Allow minor spelling variations or transliterations (e.g., matching English spelling with Hindi/Devanagari script transliteration).\n"
            )
            
        prompt += (
            "\n4. Image Quality:\n"
            "   - If the image is extremely blurry, unreadable, or a generic photo (like animals, landscapes, objects, selfies, cartoons, etc.) rather than a readable ID document, mark it as invalid.\n\n"
            "Return ONLY a JSON object in this exact schema, with no markdown formatting:\n"
            "{\n"
            "  \"valid\": true/false,\n"
            "  \"doc_type\": \"aadhaar\"/\"pan\"/\"passport\"/\"license\"/\"unknown\",\n"
            "  \"reason\": \"Detailed explanation of why it is valid or invalid (e.g., 'Document is a PAN card, but Aadhaar was expected' or 'ID card number does not match expected number' or 'Document matches all expected details').\"\n"
            "}"
        )
        
        payload = {
            "model": "meta-llama/llama-3.2-11b-vision-instruct",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_data}"
                            }
                        }
                    ]
                }
            ],
            "response_format": {
                "type": "json_object"
            }
        }
        
        def _call_api():
            return requests.post(url, json=payload, headers=headers, timeout=25)
            
        response = await asyncio.to_thread(_call_api)
        if response.status_code != 200:
            logger.error(f"OpenRouter API returned status code {response.status_code}: {response.text}")
            return {"valid": True, "doc_type": "unknown", "reason": f"OpenRouter API error status: {response.status_code}"}
            
        res_json = response.json()
        content = res_json.get("choices", [{}])[0].get("message", {}).get("content", "")
        content = content.replace("```json", "").replace("```", "").strip()
        data = json.loads(content)
        
        logger.info(f"OpenRouter ID validation result: {data}")
        return data
    except Exception as e:
        logger.error(f"Failed to validate ID proof with OpenRouter: {e}", exc_info=True)
        return {"valid": True, "doc_type": "unknown", "reason": f"Error running validation: {str(e)}"}
