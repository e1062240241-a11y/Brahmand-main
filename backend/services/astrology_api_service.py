"""Astrology API (astrologyapi.com) aggregation service."""
import asyncio
import logging
import requests
from datetime import datetime
from typing import Any, Dict, List, Optional
from config.settings import settings
from utils.cache import cache_manager

logger = logging.getLogger(__name__)

class AstrologyApiService:
    """Handles data fetch and caching for Astrology API endpoints."""

    BASE_URL = "https://json.astrologyapi.com/v1"
    
    ENDPOINTS = {
        "advanced_panchang": "/advanced_panchang",
        "planet_panchang": "/planet_panchang",
        "chaughadiya_muhurta": "/chaughadiya_muhurta",
        "hora_muhurta": "/hora_muhurta",
        "nakshatra_report": "/general_nakshatra_report",
        "astro_details": "/astro_details",
    }

    def __init__(self):
        # Access Token (ak-*) auth via x-astrologyapi-key header
        self._token = settings.ASTROLOGY_API_TOKEN
        self._request_lock = asyncio.Lock()

    def _cache_key(self, lat: float, lon: float, date_str: str) -> str:
        return f"astrology_api:panchang:{date_str}:{round(lat, 3)}:{round(lon, 3)}"

    async def _fetch_endpoint(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.BASE_URL}{endpoint}"
        
        # AstrologyAPI Access Token auth uses x-astrologyapi-key header
        headers = {
            "Content-Type": "application/json",
            "x-astrologyapi-key": self._token,
        }

        def _request():
            return requests.post(url, headers=headers, json=data, timeout=15)

        try:
            response = await asyncio.to_thread(_request)
            if response.status_code >= 400:
                logger.error("Astrology API error: %s - %s", response.status_code, response.text)
                return {"error": f"Status {response.status_code}: {response.text}"}
            return response.json()
        except Exception as e:
            logger.error("Astrology API request failed: %s", e)
            return {"error": str(e)}

    def _build_summary(self, sources: Dict[str, Any]) -> Dict[str, Any]:
        panchang = sources.get("advanced_panchang", {})
        if not isinstance(panchang, dict) or "error" in panchang:
            panchang = {}
        
        def get_val(obj, key):
            """Extract a display-friendly string from an API response field.
            
            The API returns nested structures like:
              "tithi": {"details": {"tithi_name": "Krishna Panchami", ...}, "end_time": {...}}
            We need to return just "Krishna Panchami".
            """
            val = obj.get(key)
            if val is None:
                return None
            if isinstance(val, str):
                return val
            if isinstance(val, dict):
                # Check for details sub-dict first (tithi, nakshatra, yog, karan)
                details = val.get("details")
                if isinstance(details, dict):
                    # Look for *_name keys like tithi_name, nak_name, yog_name, karan_name
                    for dk, dv in details.items():
                        if dk.endswith("_name") and isinstance(dv, str):
                            return dv
                    # Fallback to 'name' or 'special' in details
                    return details.get("name") or details.get("special") or str(details)
                # Direct name key
                return val.get("name") or str(val)
            return str(val)

        overview = [
            {"label": "Tithi", "value": get_val(panchang, "tithi")},
            {"label": "Paksha", "value": panchang.get("paksha")},
            {"label": "Nakshatra", "value": get_val(panchang, "nakshatra")},
            {"label": "Yoga", "value": get_val(panchang, "yog")},
            {"label": "Karana", "value": get_val(panchang, "karan")},
        ]
        
        timings = [
            {"label": "Sunrise", "value": panchang.get("sunrise")},
            {"label": "Sunset", "value": panchang.get("sunset")},
            {"label": "Moonrise", "value": panchang.get("moonrise")},
            {"label": "Moonset", "value": panchang.get("moonset")},
        ]
        
        insights = [
            {"label": "Sun Sign", "value": panchang.get("sun_sign")},
            {"label": "Moon Sign", "value": panchang.get("moon_sign")},
            {"label": "Ritu", "value": panchang.get("ritu")},
            {"label": "Ayan", "value": panchang.get("ayana")},
            {"label": "Disha Shool", "value": panchang.get("disha_shool")},
            {"label": "Panchang Yoga", "value": panchang.get("panchang_yog")},
        ]

        return {
            "headline": f"{get_val(panchang, 'tithi') or '-'} | {get_val(panchang, 'nakshatra') or '-'}",
            "overview": [o for o in overview if o["value"]],
            "timings": [t for t in timings if t["value"]],
            "insights": [i for i in insights if i["value"]],
        }

    async def get_full_panchang(
        self, 
        lat: float, 
        lon: float, 
        date_obj: Optional[datetime] = None,
        tz: float = 5.5
    ) -> Dict[str, Any]:
        dt = date_obj or datetime.now()
        date_str = dt.strftime("%Y-%m-%d")
        
        cache_key = self._cache_key(lat, lon, date_str)
        cached = await cache_manager.get(cache_key)
        if cached:
            return cached

        payload = {
            "day": dt.day,
            "month": dt.month,
            "year": dt.year,
            "hour": dt.hour,
            "min": dt.minute,
            "lat": lat,
            "lon": lon,
            "tzone": tz
        }

        # Fetch all endpoints in parallel to avoid frontend timeout
        tasks = []
        keys = list(self.ENDPOINTS.keys())
        for key in keys:
            tasks.append(self._fetch_endpoint(self.ENDPOINTS[key], payload))
        
        task_results = await asyncio.gather(*tasks)
        
        results = {}
        errors = {}
        for i, res in enumerate(task_results):
            key = keys[i]
            if isinstance(res, dict) and "error" in res:
                errors[key] = res["error"]
            else:
                results[key] = res

        aggregated = {
            "date": date_str,
            "coordinates": {"latitude": lat, "longitude": lon},
            "sources": results,
            "errors": errors,
            "summary": self._build_summary(results),
            "fetched_at": datetime.utcnow().isoformat() + "Z",
            "provider": "astrology_api"
        }

        await cache_manager.set(cache_key, aggregated, ttl=86400)
        return aggregated

    async def get_daily_horoscope(self, zodiac_name: str, timezone: float = 5.5) -> Dict[str, Any]:
        """Fetch daily horoscope for a given sun sign."""
        zodiac_name = zodiac_name.lower().strip()
        cache_key = f"astrology_api:horoscope:daily:{zodiac_name}:{timezone}"
        cached = await cache_manager.get(cache_key)
        if cached:
            return cached

        url = f"{self.BASE_URL}/sun_sign_prediction/daily/{zodiac_name}"
        headers = {
            "Content-Type": "application/json",
            "x-astrologyapi-key": self._token,
        }
        payload = {"timezone": timezone}

        def _request():
            return requests.post(url, headers=headers, json=payload, timeout=15)

        try:
            response = await asyncio.to_thread(_request)
            if response.status_code >= 400:
                logger.error("Astrology API Horoscope error: %s - %s", response.status_code, response.text)
                return {"error": f"Status {response.status_code}: {response.text}"}
            
            data = response.json()
            await cache_manager.set(cache_key, data, ttl=14400) # Cache for 4 hours
            return data
        except Exception as e:
            logger.error("Astrology API Horoscope request failed: %s", e)
            return {"error": str(e)}

    async def get_nakshatra_report(self, lat: float, lon: float, date_obj: datetime) -> Dict[str, Any]:
        """Fetch general nakshatra report for kundli."""
        data = {
            "day": date_obj.day,
            "month": date_obj.month,
            "year": date_obj.year,
            "hour": date_obj.hour,
            "min": date_obj.minute,
            "lat": lat,
            "lon": lon,
            "tzone": 5.5
        }
        return await self._fetch_endpoint(self.ENDPOINTS["nakshatra_report"], data)

    async def get_astro_details(self, lat: float, lon: float, date_obj: datetime) -> Dict[str, Any]:
        """Fetch birth details like nakshatra, rashi, gan, etc."""
        data = {
            "day": date_obj.day,
            "month": date_obj.month,
            "year": date_obj.year,
            "hour": date_obj.hour,
            "min": date_obj.minute,
            "lat": lat,
            "lon": lon,
            "tzone": 5.5
        }
        return await self._fetch_endpoint(self.ENDPOINTS["astro_details"], data)

astrology_api_service = AstrologyApiService()
