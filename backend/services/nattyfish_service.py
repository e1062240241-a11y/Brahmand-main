import logging
import httpx
import os
import re
from typing import Dict, Any
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
    """Return number in 91XXXXXXXXXX format required by Nettyfish."""
    return f"91{mobile_10}"


class NattyFishService:
    """Service to handle SMS sending via NattyFish API."""

    ENDPOINT = "https://retailsms.nettyfish.com/api/mt/SendSMS"

    @staticmethod
    def _username() -> str:
        return os.getenv("NATTYFISH_USERNAME", "").strip()

    @staticmethod
    def _password() -> str:
        return os.getenv("NATTYFISH_PASSWORD", "").strip()

    @staticmethod
    def _sender_id() -> str:
        return os.getenv("NATTYFISH_SENDER_ID", "SHRSDD").strip()

    @staticmethod
    def _channel() -> str:
        return os.getenv("NATTYFISH_CHANNEL", "Trans").strip()

    @staticmethod
    def _pe_id() -> str:
        return (os.getenv("NATTYFISH_PE_ID") or os.getenv("MSG91_PE_ID") or "1701167048221300150").strip()

    @staticmethod
    def _template_id() -> str:
        return (os.getenv("NATTYFISH_TEMPLATE_ID") or os.getenv("MSG91_TEMPLATE_ID") or "1707178151289895753").strip()

    @staticmethod
    def _check_config():
        if not NattyFishService._username():
            raise HTTPException(
                status_code=500,
                detail="NATTYFISH_USERNAME not configured in .env"
            )
        if not NattyFishService._password():
            raise HTTPException(
                status_code=500,
                detail="NATTYFISH_PASSWORD not configured in .env"
            )

    @staticmethod
    async def send_sms(phone: str, text: str) -> Dict[str, Any]:
        """Send a transactional SMS using the NattyFish API (async, non-blocking)."""
        if not phone:
            raise HTTPException(status_code=400, detail="Phone number is required")
        if not text:
            raise HTTPException(status_code=400, detail="Message text is required")

        use_mock = os.getenv("USE_MOCK_OTP", "false").lower() == "true"
        mobile_10 = _normalize_phone(phone)
        mobile_e164 = _with_country_code(mobile_10)

        if use_mock:
            logger.info(f"[NattyFish] Mock send_sms bypassed — mobile={mobile_e164}, text={text}")
            return {"status": "success", "message": "SMS sent successfully (mocked)"}

        NattyFishService._check_config()

        # Build query parameters
        params = {
            "user": NattyFishService._username(),
            "password": NattyFishService._password(),
            "senderid": NattyFishService._sender_id(),
            "channel": NattyFishService._channel(),
            "DCS": "0",
            "flashsms": "0",
            "number": mobile_e164,
            "text": text,
            "EntityId": NattyFishService._pe_id(),
            "dlttemplateid": NattyFishService._template_id()
        }

        # Mask password in log
        logged_params = {**params, "password": "****"}
        logger.info(f"[NattyFish] Sending SMS to {NattyFishService.ENDPOINT} with params: {logged_params}")

        try:
            # Use async httpx client to avoid blocking the FastAPI event loop
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(NattyFishService.ENDPOINT, params=params)

            logger.info(f"[NattyFish] SMS Response Status: {response.status_code}, Body: {response.text}")

            if response.status_code == 200:
                try:
                    result = response.json()
                    error_code = str(result.get("ErrorCode", "")).strip()
                    if error_code == "000":
                        return {"status": "success", "response": result}
                    else:
                        error_msg = result.get("ErrorMessage", "Unknown error from SMS gateway")
                        logger.error(f"[NattyFish] Send SMS failed — ErrorCode={error_code}, ErrorMessage={error_msg}")
                        raise HTTPException(
                            status_code=400,
                            detail=f"SMS Gateway Error: {error_msg}"
                        )
                except (ValueError, KeyError):
                    # Response is plain text (some Nettyfish endpoints return non-JSON)
                    raw = response.text.strip()
                    if "Done" in raw or "ErrorCode: 000" in raw or "ErrorCode=000" in raw:
                        logger.info(f"[NattyFish] SMS sent (plain-text OK response): {raw}")
                        return {"status": "success", "raw_response": raw}
                    logger.error(f"[NattyFish] Non-JSON error response: {raw}")
                    raise HTTPException(
                        status_code=502,
                        detail=f"SMS gateway returned unexpected response: {raw[:200]}"
                    )
            else:
                logger.error(f"[NattyFish] HTTP {response.status_code}: {response.text}")
                raise HTTPException(
                    status_code=502,
                    detail=f"SMS gateway HTTP error {response.status_code}"
                )

        except HTTPException:
            raise
        except httpx.ConnectError as exc:
            logger.error(f"[NattyFish] Connection failed — could not reach {NattyFishService.ENDPOINT}: {exc}")
            raise HTTPException(
                status_code=503,
                detail="Could not reach SMS gateway. Check network connectivity."
            )
        except httpx.TimeoutException as exc:
            logger.error(f"[NattyFish] Request timed out: {exc}")
            raise HTTPException(
                status_code=504,
                detail="SMS gateway request timed out. Please try again."
            )
        except Exception as exc:
            logger.exception(f"[NattyFish] Unexpected error while sending SMS: {exc}")
            raise HTTPException(
                status_code=500,
                detail=f"SMS delivery failed: {exc}"
            )
