import logging
import requests
import os
import re
from typing import Dict, Any, Optional
from fastapi import HTTPException

logger = logging.getLogger(__name__)

def _normalize_phone(phone: str) -> str:
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 10:
        return digits
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    if len(digits) == 11 and digits.startswith("0"):
        return digits[1:]
    raise HTTPException(status_code=400, detail="Invalid phone number. Must be a 10-digit Indian mobile number.")

class MSG91Service:
    """Service to handle MSG91 OTP via HTTP API (Custom UI)"""
    
    AUTH_KEY = os.getenv("MSG91_AUTH_KEY") or os.getenv("MSG91_KEY_AUTHORIZATION")
    SEND_OTP_URL = "https://api.msg91.com/api/v5/otp"
    VERIFY_OTP_URL = "https://api.msg91.com/api/v5/otp/verify"
    RETRY_OTP_URL = "https://api.msg91.com/api/v5/otp/retry"
    TEMPLATE_ID = os.getenv("MSG91_TEMPLATE_ID")
    SENDER_ID = os.getenv("MSG91_SENDER_ID")
    PE_ID = os.getenv("MSG91_PE_ID")

    @staticmethod
    async def send_otp(phone: str) -> Dict[str, Any]:
        """Send OTP to mobile number using MSG91 API"""
        if not phone:
            raise HTTPException(status_code=400, detail="Phone number is required")

        mobile = _normalize_phone(phone)

        if not MSG91Service.AUTH_KEY:
            raise HTTPException(status_code=500, detail="MSG91_AUTH_KEY not configured. Set MSG91_KEY_AUTHORIZATION in .env")
        if not MSG91Service.TEMPLATE_ID:
            raise HTTPException(status_code=500, detail="MSG91_TEMPLATE_ID not configured. Set MSG91_TEMPLATE_ID in .env")

        headers = {
            "authkey": MSG91Service.AUTH_KEY,
            "content-type": "application/json"
        }
        
        payload = {
            "template_id": MSG91Service.TEMPLATE_ID,
            "mobile": mobile,
            "country": "91",
            "otp_length": 4,
            "otp_expiry": 5
        }
        if MSG91Service.SENDER_ID:
            payload["sender_id"] = MSG91Service.SENDER_ID
        if MSG91Service.PE_ID:
            payload["pe_id"] = MSG91Service.PE_ID

        use_mock = os.getenv("USE_MOCK_OTP", "false").lower() == "true"
        if use_mock:
            logger.info(f"Mock MSG91 send_otp bypassed for mobile={mobile}")
            return {"type": "success", "message": "OTP sent successfully (mocked)"}

        try:
            logger.info(f"Sending MSG91 OTP to 91{mobile} with template {MSG91Service.TEMPLATE_ID}")
            logger.info(f"MSG91 payload: {payload}")
            response = requests.post(MSG91Service.SEND_OTP_URL, json=payload, headers=headers, timeout=10)
            result = response.json()
            logger.info(f"MSG91 raw response: {result}")
            
            if result.get("type") == "success":
                logger.info(f"MSG91 OTP sent successfully to {mobile}")
                return result

            msg = result.get("message") or result.get("error") or "Failed to send OTP via MSG91"
            logger.warning(f"MSG91 OTP send failed: {result}")
            raise HTTPException(status_code=400, detail=msg)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Exception during MSG91 OTP send: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to send OTP: {str(e)}")

    @staticmethod
    async def verify_otp(phone: str, otp: str) -> Dict[str, Any]:
        """Verify OTP with MSG91 API"""
        if not phone or not otp:
            raise HTTPException(status_code=400, detail="Phone and OTP are required")

        mobile = _normalize_phone(phone)

        if not MSG91Service.AUTH_KEY:
            raise HTTPException(status_code=500, detail="MSG91_AUTH_KEY not configured. Set MSG91_KEY_AUTHORIZATION in .env")

        headers = {
            "authkey": MSG91Service.AUTH_KEY
        }
        
        params = {
            "otp": otp,
            "mobile": mobile,
            "country": "91"
        }

        use_mock = os.getenv("USE_MOCK_OTP", "false").lower() == "true"
        if use_mock:
            logger.info(f"Mock MSG91 verify_otp bypassed for mobile={mobile}")
            return {"type": "success", "message": "OTP verified successfully (mocked)"}

        try:
            logger.info(f"Verifying MSG91 OTP for {mobile}")
            response = requests.get(MSG91Service.VERIFY_OTP_URL, params=params, headers=headers, timeout=10)
            result = response.json()
            logger.info(f"MSG91 verify raw response: {result}")
            
            if result.get("type") == "success":
                logger.info(f"MSG91 OTP verified for {mobile}")
                return result

            msg = result.get("message") or result.get("error") or "Invalid OTP. Please try again later."
            logger.warning(f"MSG91 OTP verification failed: {result}")
            raise HTTPException(status_code=400, detail=msg)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Exception during MSG91 OTP verification: {e}")
            raise HTTPException(status_code=500, detail=f"OTP verification failed: {str(e)}")

    @staticmethod
    async def retry_otp(phone: str, channel: str = "11") -> Dict[str, Any]:
        """Retry OTP via specified channel (11 for SMS)"""
        mobile = _normalize_phone(phone)

        headers = {
            "authkey": MSG91Service.AUTH_KEY
        }
        
        params = {
            "mobile": mobile,
            "country": "91",
            "retrytype": channel
        }

        try:
            logger.info(f"MSG91 retry OTP for {mobile}")
            response = requests.get(MSG91Service.RETRY_OTP_URL, params=params, headers=headers, timeout=10)
            result = response.json()
            logger.info(f"MSG91 retry raw response: {result}")
            return result
        except Exception as e:
            logger.error(f"MSG91 retry failed: {e}")
            return {"type": "error", "message": str(e)}

    @staticmethod
    async def send_blood_otp(phone: str) -> Dict[str, Any]:
        """Send OTP specifically for Blood Request creation using required MSG91 configuration"""
        if not phone:
            raise HTTPException(status_code=400, detail="Phone number is required")

        mobile = _normalize_phone(phone)
        auth_key = os.getenv("MSG91_AUTH_KEY") or os.getenv("MSG91_KEY_AUTHORIZATION")

        if not auth_key:
            raise HTTPException(status_code=500, detail="MSG91_AUTH_KEY not configured. Set MSG91_AUTH_KEY in environment variables.")

        headers = {
            "authkey": auth_key,
            "content-type": "application/json"
        }
        
        payload = {
            "template_id": "1707178151289895753",
            "mobile": mobile,
            "country": "91",
            "otp_length": 4,
            "otp_expiry": 5,
            "sender_id": "SHRSDD",
            "PE_ID": "1701167048221300150",
            "DLT_PE_ID": "1701167048221300150"
        }

        use_mock = os.getenv("USE_MOCK_OTP", "false").lower() == "true"
        if use_mock:
            logger.info(f"Mock MSG91 send_blood_otp bypassed for mobile={mobile}")
            return {"type": "success", "message": "OTP sent successfully (mocked)"}

        try:
            logger.info(f"Sending MSG91 Blood Request OTP to 91{mobile} with template 1707178151289895753")
            response = requests.post(MSG91Service.SEND_OTP_URL, json=payload, headers=headers, timeout=10)
            result = response.json()
            logger.info(f"MSG91 send raw response: {result}")
            
            if result.get("type") == "success":
                logger.info(f"MSG91 Blood Request OTP sent successfully to {mobile}")
                return result

            msg = result.get("message") or result.get("error") or "Failed to send OTP via MSG91"
            logger.warning(f"MSG91 Blood Request OTP send failed: {result}")
            raise HTTPException(status_code=400, detail=msg)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Exception during MSG91 Blood OTP send: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to send OTP: {str(e)}")

    @staticmethod
    async def verify_blood_otp(phone: str, otp: str) -> Dict[str, Any]:
        """Verify OTP for Blood Request creation"""
        if not phone or not otp:
            raise HTTPException(status_code=400, detail="Phone and OTP are required")

        mobile = _normalize_phone(phone)
        auth_key = os.getenv("MSG91_AUTH_KEY") or os.getenv("MSG91_KEY_AUTHORIZATION")

        if not auth_key:
            raise HTTPException(status_code=500, detail="MSG91_AUTH_KEY not configured. Set MSG91_AUTH_KEY in environment variables.")

        headers = {
            "authkey": auth_key
        }
        
        params = {
            "otp": otp,
            "mobile": mobile,
            "country": "91"
        }

        use_mock = os.getenv("USE_MOCK_OTP", "false").lower() == "true"
        if use_mock:
            logger.info(f"Mock MSG91 verify_blood_otp bypassed for mobile={mobile}")
            return {"type": "success", "message": "OTP verified successfully (mocked)"}

        try:
            logger.info(f"Verifying MSG91 Blood OTP for {mobile}")
            response = requests.get(MSG91Service.VERIFY_OTP_URL, params=params, headers=headers, timeout=10)
            result = response.json()
            logger.info(f"MSG91 verify raw response: {result}")
            
            if result.get("type") == "success":
                logger.info(f"MSG91 Blood OTP verified for {mobile}")
                return result

            msg = result.get("message") or result.get("error") or "Invalid OTP. Please try again later."
            logger.warning(f"MSG91 Blood OTP verification failed: {result}")
            raise HTTPException(status_code=400, detail=msg)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Exception during MSG91 Blood OTP verification: {e}")
            raise HTTPException(status_code=500, detail=f"OTP verification failed: {str(e)}")


