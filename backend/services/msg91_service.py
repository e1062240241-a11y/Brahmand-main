import logging
import requests
import os
import re
from typing import Dict, Any, Optional
from fastapi import HTTPException

logger = logging.getLogger(__name__)


def _normalize_phone(phone: str) -> str:
    """Return a clean 10-digit Indian mobile number (no country code)."""
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 10:
        return digits
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    if len(digits) == 13 and digits.startswith("091"):
        return digits[3:]
    if len(digits) == 11 and digits.startswith("0"):
        return digits[1:]
    raise HTTPException(
        status_code=400,
        detail="Invalid phone number. Must be a 10-digit Indian mobile number."
    )


def _with_country_code(mobile_10: str) -> str:
    """Return number in 91XXXXXXXXXX format required by MSG91 OTP API."""
    return f"91{mobile_10}"


class MSG91Service:
    """Service to handle MSG91 OTP via HTTP API (Custom UI / OTP Widget)."""

    # ── Class-level URL constants (stable) ──────────────────────────────────
    SEND_OTP_URL   = "https://api.msg91.com/api/v5/otp"
    VERIFY_OTP_URL = "https://api.msg91.com/api/v5/otp/verify"
    RETRY_OTP_URL  = "https://api.msg91.com/api/v5/otp/retry"

    # ── Env vars are read at call-time so a server restart is not needed ─────
    @staticmethod
    def _auth_key() -> str:
        return os.getenv("MSG91_AUTH_KEY") or os.getenv("MSG91_KEY_AUTHORIZATION") or ""

    @staticmethod
    def _template_id() -> str:
        return os.getenv("MSG91_TEMPLATE_ID") or ""

    @staticmethod
    def _sender_id() -> Optional[str]:
        return os.getenv("MSG91_SENDER_ID")

    @staticmethod
    def _pe_id() -> Optional[str]:
        return os.getenv("MSG91_PE_ID")

    # ── Helpers ──────────────────────────────────────────────────────────────
    @staticmethod
    def _check_config():
        if not MSG91Service._auth_key():
            raise HTTPException(
                status_code=500,
                detail="MSG91_KEY_AUTHORIZATION not configured in .env"
            )
        if not MSG91Service._template_id():
            raise HTTPException(
                status_code=500,
                detail="MSG91_TEMPLATE_ID not configured in .env"
            )

    @staticmethod
    def _build_headers() -> Dict[str, str]:
        return {
            "authkey": MSG91Service._auth_key(),
            "content-type": "application/json",
        }

    # ── Send OTP ─────────────────────────────────────────────────────────────
    @staticmethod
    async def send_otp(phone: str) -> Dict[str, Any]:
        """Send OTP to a mobile number using MSG91 OTP API.

        MSG91 OTP API requires the mobile number in **91XXXXXXXXXX** format
        (country code prepended, no '+' sign).  The `country` field is
        included for legacy/compatibility reasons but the number itself must
        carry the prefix.
        """
        if not phone:
            raise HTTPException(status_code=400, detail="Phone number is required")

        use_mock = os.getenv("USE_MOCK_OTP", "false").lower() == "true"

        mobile_10  = _normalize_phone(phone)
        mobile_e164 = _with_country_code(mobile_10)   # e.g. 919876543210

        if use_mock:
            logger.info(f"[MSG91] Mock send_otp bypassed — mobile={mobile_e164}")
            return {"type": "success", "message": "OTP sent successfully (mocked)"}

        MSG91Service._check_config()

        payload: Dict[str, Any] = {
            "template_id": MSG91Service._template_id(),
            "mobile":      mobile_e164,     # ← Must include country code
            "otp_length":  4,
            "otp_expiry":  10,              # minutes
            # DLT_TE_ID = TRAI DLT Template ID (mandatory for Indian SMS delivery)
            # This must be the DLT Template ID, NOT the Principal Entity ID.
            "DLT_TE_ID":   MSG91Service._template_id(),
        }

        sender_id = MSG91Service._sender_id()
        pe_id     = MSG91Service._pe_id()
        if sender_id:
            payload["sender"] = sender_id
        if pe_id:
            # PE_ID (Principal Entity ID) is already tied to the authkey in MSG91.
            # Some MSG91 configurations also accept it explicitly.
            payload["pe_id"] = pe_id

        logger.info(f"[MSG91] Sending OTP to {mobile_e164} "
                    f"(template={MSG91Service._template_id()})")
        logger.info(f"[MSG91] Payload: {payload}")

        try:
            response = requests.post(
                MSG91Service.SEND_OTP_URL,
                json=payload,
                headers=MSG91Service._build_headers(),
                timeout=10,
            )
            result = response.json()
            logger.info(f"[MSG91] send_otp response: {result}")

            if result.get("type") == "success":
                return result

            msg = (result.get("message") or result.get("error")
                   or "Failed to send OTP via MSG91")
            logger.warning(f"[MSG91] send_otp failed: {result}")
            raise HTTPException(status_code=400, detail=msg)

        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"[MSG91] send_otp exception: {exc}")
            raise HTTPException(
                status_code=500, detail=f"Failed to send OTP: {exc}"
            )

    # ── Verify OTP ───────────────────────────────────────────────────────────
    @staticmethod
    async def verify_otp(phone: str, otp: str) -> Dict[str, Any]:
        """Verify OTP with MSG91 API.

        The verify endpoint also expects the mobile in **91XXXXXXXXXX** format.
        """
        if not phone or not otp:
            raise HTTPException(
                status_code=400, detail="Phone and OTP are required"
            )

        use_mock = os.getenv("USE_MOCK_OTP", "false").lower() == "true"

        mobile_10   = _normalize_phone(phone)
        mobile_e164 = _with_country_code(mobile_10)

        if use_mock:
            logger.info(f"[MSG91] Mock verify_otp bypassed — mobile={mobile_e164}")
            return {"type": "success", "message": "OTP verified successfully (mocked)"}

        if not MSG91Service._auth_key():
            raise HTTPException(
                status_code=500,
                detail="MSG91_KEY_AUTHORIZATION not configured in .env"
            )

        params = {
            "otp":    otp,
            "mobile": mobile_e164,   # ← Must include country code
        }

        logger.info(f"[MSG91] Verifying OTP for {mobile_e164}")

        try:
            response = requests.get(
                MSG91Service.VERIFY_OTP_URL,
                params=params,
                headers=MSG91Service._build_headers(),
                timeout=10,
            )
            result = response.json()
            logger.info(f"[MSG91] verify_otp response: {result}")

            if result.get("type") == "success":
                return result

            msg = (result.get("message") or result.get("error")
                   or "Invalid OTP. Please try again.")
            logger.warning(f"[MSG91] verify_otp failed: {result}")
            raise HTTPException(status_code=400, detail=msg)

        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"[MSG91] verify_otp exception: {exc}")
            raise HTTPException(
                status_code=500, detail=f"OTP verification failed: {exc}"
            )

    # ── Retry OTP ────────────────────────────────────────────────────────────
    @staticmethod
    async def retry_otp(phone: str, channel: str = "text") -> Dict[str, Any]:
        """Retry OTP delivery via SMS (channel='text') or voice (channel='voice')."""
        mobile_10   = _normalize_phone(phone)
        mobile_e164 = _with_country_code(mobile_10)

        params = {
            "mobile":    mobile_e164,
            "retrytype": channel,      # 'text' or 'voice'
        }

        try:
            logger.info(f"[MSG91] Retrying OTP for {mobile_e164} via {channel}")
            response = requests.get(
                MSG91Service.RETRY_OTP_URL,
                params=params,
                headers=MSG91Service._build_headers(),
                timeout=10,
            )
            result = response.json()
            logger.info(f"[MSG91] retry_otp response: {result}")
            return result
        except Exception as exc:
            logger.error(f"[MSG91] retry_otp exception: {exc}")
            return {"type": "error", "message": str(exc)}

    # ── Blood-request OTP (delegates to standard OTP methods) ────────────────
    @staticmethod
    async def send_blood_otp(phone: str) -> Dict[str, Any]:
        """Send OTP for Blood Request creation."""
        return await MSG91Service.send_otp(phone)

    @staticmethod
    async def verify_blood_otp(phone: str, otp: str) -> Dict[str, Any]:
        """Verify OTP for Blood Request creation."""
        return await MSG91Service.verify_otp(phone, otp)
