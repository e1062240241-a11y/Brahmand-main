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

    def _flatten_for_display(self, value: Any, prefix: str = "") -> List[Dict[str, str]]:
        """Convert nested API response into a flat list of label/value pairs."""
        rows: List[Dict[str, str]] = []
        if value in (None, "", [], {}):
            return rows

        if isinstance(value, dict):
            # Special handling for common timing/interval structures
            start = value.get("start") or value.get("start_time") or value.get("from")
            end = value.get("end") or value.get("end_time") or value.get("to")
            if prefix and (start or end):
                rows.append({
                    "label": prefix,
                    "value": f"{start or '-'} - {end or '-'}",
                })
                return rows

            for key, item in value.items():
                label = key.replace("_", " ").title()
                full_label = f"{prefix} {label}".strip()
                
                # Special handling for "details" - unwrap it instead of skipping
                if key == "details" and isinstance(item, dict):
                    rows.extend(self._flatten_for_display(item, prefix))
                    continue

                # Skip large/unnecessary internal structures
                if key in ("bot_response", "status"):
                    continue

                if isinstance(item, (dict, list)):
                    rows.extend(self._flatten_for_display(item, full_label))
                    continue
                
                if item not in (None, "", [], {}):
                    rows.append({"label": full_label, "value": str(item)})
            return rows[:30]

        if isinstance(value, list):
            for index, item in enumerate(value[:10], start=1):
                item_prefix = f"{prefix} {index}".strip()
                rows.extend(self._flatten_for_display(item, item_prefix))
            return rows[:30]

        if value not in (None, "", [], {}):
            rows.append({"label": prefix or "Value", "value": str(value)})
        return rows

    def _build_detail_sections(self, sources: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Group source data into sections for UI display."""
        sections: List[Dict[str, Any]] = []
        priority = ["advanced_panchang", "chaughadiya_muhurta", "hora_muhurta", "planet_panchang", "nakshatra_report", "astro_details"]
        
        for key in priority:
            if key not in sources:
                continue
            
            rows = self._flatten_for_display(sources[key])
            if rows:
                sections.append({
                    "key": key,
                    "title": key.replace("_", " ").title(),
                    "rows": rows,
                })
        return sections

    def _transform_muhurtas(self, data: Any) -> Dict[str, List[Dict[str, Any]]]:
        """Normalize Chaughadiya/Hora data into {day: [], night: []} with 'time' field."""
        if not isinstance(data, dict):
            return {"day": [], "night": []}
        
        result = {"day": [], "night": []}
        for period in ["day", "night"]:
            items = data.get(period) or data.get(period.capitalize()) or []
            if not isinstance(items, list):
                items = []
            
            transformed = []
            for item in items:
                if not isinstance(item, dict):
                    continue
                
                # Create 'time' field from start/end
                start = item.get("start") or item.get("start_time")
                end = item.get("end") or item.get("end_time")
                
                # Build a clean item for frontend
                clean_item = {**item}
                if start and end:
                    clean_item["time"] = f"{start} - {end}"
                elif start:
                    clean_item["time"] = start
                
                # For Hora, ensure 'hora' field exists (API might use 'name')
                if "hora" not in clean_item and "name" in clean_item:
                    clean_item["hora"] = clean_item["name"]
                
                transformed.append(clean_item)
            result[period] = transformed
        
        return result

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
                if key in ("chaughadiya_muhurta", "hora_muhurta"):
                    raw_data = res.get(key.split('_')[0]) if isinstance(res, dict) and key.split('_')[0] in res else res
                    results[key] = self._transform_muhurtas(raw_data)
                elif key == "planet_panchang" and isinstance(res, list):
                    # Normalize planet fields
                    transformed = []
                    for p in res:
                        if not isinstance(p, dict):
                            continue
                        clean_p = {**p}
                        if "name" not in clean_p and "planet_name" in p:
                            clean_p["name"] = p["planet_name"]
                        if "full_degree" not in clean_p and "fullDegree" in p:
                            clean_p["full_degree"] = p["fullDegree"]
                        transformed.append(clean_p)
                    results[key] = transformed
                else:
                    results[key] = res

        aggregated = {
            "date": date_str,
            "coordinates": {"latitude": lat, "longitude": lon},
            "sources": results,
            "errors": errors,
            "summary": self._build_summary(results),
            "detail_sections": self._build_detail_sections(results),
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
            # Normalize prediction to always be a string or object
            # If it's a list, join it into a string or keep it as paragraphs
            prediction = data.get("prediction")
            if isinstance(prediction, list):
                data["prediction"] = "\n\n".join([str(p) for p in prediction])
            
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
        raw = await self._fetch_endpoint(self.ENDPOINTS["nakshatra_report"], data)
        # Normalize for frontend: report should be { category: [paragraphs] }
        if not isinstance(raw, dict) or "prediction" not in raw:
            return raw
            
        prediction = raw.get("prediction", {})
        normalized_report = {}
        if isinstance(prediction, dict):
            for key, val in prediction.items():
                label = key.replace("_", " ").title()
                if isinstance(val, list):
                    normalized_report[label] = val
                else:
                    normalized_report[label] = [str(val)]
        
        return normalized_report

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
        raw = await self._fetch_endpoint(self.ENDPOINTS["astro_details"], data)
        # Normalize keys for frontend (Naksahtra -> Nakshatra, Sign -> sign, etc.)
        if not isinstance(raw, dict):
            return raw
            
        normalized = {**raw}
        if "Naksahtra" in raw: normalized["Naksahtra"] = raw["Naksahtra"]
        if "SignLord" in raw: normalized["SignLord"] = raw["SignLord"]
        # The frontend uses 'sign' and 'Naksahtra'
        return normalized

astrology_api_service = AstrologyApiService()
