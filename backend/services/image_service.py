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
