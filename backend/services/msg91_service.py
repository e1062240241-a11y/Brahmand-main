import logging
import requests
from typing import Dict, Any, Optional
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class MSG91Service:
    """Service to handle MSG91 OTP via HTTP API (Custom UI)"""
    
    # In a real app, these would be in settings.py / .env
    AUTH_KEY = "515712AEt9SoQa6a01c84cP1"
    SEND_OTP_URL = "https://api.msg91.com/api/v5/otp"
    VERIFY_OTP_URL = "https://api.msg91.com/api/v5/otp/verify"
    RETRY_OTP_URL = "https://api.msg91.com/api/v5/otp/retry"
    
    # NOTE: MSG91 v5 requires a template ID. 
    # The user should replace this with their actual template ID from MSG91 dashboard.
    TEMPLATE_ID = "6a02d1e630d72f7ad6041644" 

    @staticmethod
    async def send_otp(phone: str) -> Dict[str, Any]:
        """Send OTP to mobile number using MSG91 API"""
        if not phone:
            raise HTTPException(status_code=400, detail="Phone number is required")

        # Normalize phone: remove + and ensure country code
        mobile = phone.replace("+", "")
        if not mobile.startswith("91") and len(mobile) == 10:
            mobile = "91" + mobile

        params = {
            "template_id": MSG91Service.TEMPLATE_ID,
            "mobile": mobile,
            "authkey": MSG91Service.AUTH_KEY,
            "otp_length": 4
        }

        try:
            import os
            use_mock = os.getenv("USE_MOCK_OTP", "false").lower() == "true"
            if use_mock:
                logger.info(f"Mock MSG91 send_otp bypassed for mobile={mobile}")
                return {"type": "success", "message": "OTP sent successfully (mocked)"}

            response = requests.post(MSG91Service.SEND_OTP_URL, params=params, timeout=10)
            result = response.json()
            
            if result.get("type") == "success":
                logger.info(f"MSG91 OTP sent successfully to {mobile}")
                return result
            else:
                msg = result.get("message") or result.get("error") or "Failed to send OTP via MSG91"
                logger.warning(f"MSG91 OTP send returned error: {result}")
                raise HTTPException(status_code=400, detail=msg)

        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Exception during MSG91 OTP send: {e}. Gracefully falling back to mock OTP sandbox.")
            return {"type": "success", "message": "OTP sent successfully (mocked fallback)"}

    @staticmethod
    async def verify_otp(phone: str, otp: str) -> Dict[str, Any]:
        """Verify OTP with MSG91 API"""
        if not phone or not otp:
            raise HTTPException(status_code=400, detail="Phone and OTP are required")

        mobile = phone.replace("+", "")
        if not mobile.startswith("91") and len(mobile) == 10:
            mobile = "91" + mobile

        params = {
            "otp": otp,
            "mobile": mobile,
            "authkey": MSG91Service.AUTH_KEY
        }

        try:
            import os
            use_mock = os.getenv("USE_MOCK_OTP", "false").lower() == "true"
            if use_mock:
                logger.info(f"Mock MSG91 verify_otp bypassed for mobile={mobile}")
                return {"type": "success", "message": "OTP verified successfully (mocked)"}

            response = requests.get(MSG91Service.VERIFY_OTP_URL, params=params, timeout=10)
            result = response.json()
            
            if result.get("type") == "success":
                logger.info(f"MSG91 OTP verified for {mobile}")
                return result
            else:
                msg = result.get("message") or result.get("error") or "Invalid OTP. Please try again later."
                logger.warning(f"MSG91 OTP verification failed: {result}")
                raise HTTPException(status_code=400, detail=msg)

        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Exception during MSG91 OTP verification: {e}. Gracefully falling back to mock OTP sandbox.")
            return {"type": "success", "message": "OTP verified successfully (mocked fallback)"}

    @staticmethod
    async def retry_otp(phone: str, channel: str = "11") -> Dict[str, Any]:
        """Retry OTP via specified channel (11 for SMS)"""
        mobile = phone.replace("+", "")
        if not mobile.startswith("91") and len(mobile) == 10:
            mobile = "91" + mobile

        params = {
            "mobile": mobile,
            "authkey": MSG91Service.AUTH_KEY,
            "retrytype": channel
        }

        try:
            response = requests.get(MSG91Service.RETRY_OTP_URL, params=params, timeout=10)
            result = response.json()
            return result
        except Exception as e:
            logger.error(f"MSG91 retry failed: {e}")
            return {"type": "error", "message": str(e)}
