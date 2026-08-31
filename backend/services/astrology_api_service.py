"""Astrology API (astrologyapi.com) aggregation service."""
import asyncio
import logging
import httpx
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
        # ~10km precision: same panchang data within ~10km, so coarser keys maximize cache hits.
        return f"astrology_api:panchang:{date_str}:{round(lat, 1)}:{round(lon, 1)}"

    async def _fetch_endpoint(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.BASE_URL}{endpoint}"
        headers = {
            "Content-Type": "application/json",
            "x-astrologyapi-key": self._token,
        }
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post(url, headers=headers, json=data)
            if response.status_code >= 400:
                logger.error("Astrology API error: %s - %s", response.status_code, response.text)
                return {"error": f"Status {response.status_code}: {response.text}"}
            return response.json()
        except Exception as e:
            logger.error("Astrology API request failed: %s", e)
            return {"error": "An internal server error occurred while fetching astrology data"}

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
        tz: float = 5.5,
        force_refresh: bool = False,
    ) -> Dict[str, Any]:
        dt = date_obj or datetime.now()
        date_str = dt.strftime("%Y-%m-%d")
        
        cache_key = self._cache_key(lat, lon, date_str)

        if not force_refresh:
            cached = await cache_manager.get(cache_key)
            if cached:
                return cached

        # Lock to prevent thundering herd: only one batch of API calls for the
        # same date+coords even if 1000 users hit a cold cache at 6 AM.
        async with self._request_lock:
            # Double-check: another request may have populated cache while we waited
            if not force_refresh:
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

            # Write cache inside the lock so blocked waiters always hit it on
            # their double-check, instead of re-fetching from the API.
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

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post(url, headers=headers, json=payload)
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
            return {"error": "An internal server error occurred while fetching horoscope data"}

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

    async def get_kundli_data(
        self,
        lat: float,
        lon: float,
        dob_str: str,  # YYYY-MM-DD
        tob_str: str,  # HH:MM
        tz: float = 5.5
    ) -> Dict[str, Any]:
        """Fetch general nakshatra report, planetary positions, D1/D9 charts, doshas and remedies using AstrologyAPI.com."""
        import re

        cache_key = f"astrology_api:kundli:{dob_str}:{tob_str}:{round(lat, 3)}:{round(lon, 3)}:{tz}"
        cached = await cache_manager.get(cache_key)
        if cached:
            return cached

        try:
            dt_obj = datetime.strptime(f"{dob_str} {tob_str}", "%Y-%m-%d %H:%M")
        except ValueError:
            dt_obj = datetime.now()

        payload = {
            "day": dt_obj.day,
            "month": dt_obj.month,
            "year": dt_obj.year,
            "hour": dt_obj.hour,
            "min": dt_obj.minute,
            "lat": lat,
            "lon": lon,
            "tzone": tz
        }

        # List of parallel tasks to fetch
        tasks = {
            "planets": self._fetch_endpoint("/planets", payload.copy()),
            "chart_d1": self._fetch_endpoint("/horo_chart_image/D1", {**payload.copy(), "chartType": "north", "image_type": "svg"}),
            "chart_d9": self._fetch_endpoint("/horo_chart_image/D9", {**payload.copy(), "chartType": "north", "image_type": "svg"}),
            "manglik": self._fetch_endpoint("/manglik", payload.copy()),
            "kalsarpa": self._fetch_endpoint("/kalsarpa_details", payload.copy()),
            "pitra": self._fetch_endpoint("/pitra_dosha_report", payload.copy()),
            "sade_sati": self._fetch_endpoint("/sadhesati_current_status", payload.copy()),
            "gems": self._fetch_endpoint("/basic_gem_suggestion", payload.copy()),
            "rudraksha": self._fetch_endpoint("/rudraksha_suggestion", payload.copy()),
            "dasha": self._fetch_endpoint("/major_vdasha", payload.copy())
        }

        task_names = list(tasks.keys())
        task_results = await asyncio.gather(*tasks.values())
        raw_data = dict(zip(task_names, task_results))

        # 1. Map planets
        planets_raw = raw_data.get("planets")
        planets_list = []
        if isinstance(planets_raw, list):
            for item in planets_raw:
                if isinstance(item, dict) and "name" in item:
                    planets_list.append({
                        "name": item.get("name"),
                        "norm_degree": item.get("normDegree") or 0.0,
                        "sign": item.get("sign") or "-",
                        "sign_lord": item.get("signLord") or "-",
                        "nakshatra": item.get("nakshatra") or "-",
                        "nakshatra_lord": item.get("nakshatraLord") or item.get("nakshatra_lord") or "-",
                        "house": item.get("house") or 1,
                        "is_retro": "true" if str(item.get("isRetro")).lower() == "true" else "false"
                    })
        planets_data = {"response": planets_list}

        # 2. Map charts D1 and D9
        d1_raw = raw_data.get("chart_d1")
        d1_svg = d1_raw.get("svg", "") if isinstance(d1_raw, dict) else ""
        if d1_svg and "viewBox=" not in d1_svg:
            d1_svg = re.sub(
                r'<svg([^>]*)(width|height)="[^"]*"([^>]*)(width|height)="[^"]*"',
                r'<svg\1 viewBox="0 0 350 350"',
                d1_svg
            )
            if "viewBox=" not in d1_svg:
                d1_svg = d1_svg.replace("<svg", '<svg viewBox="0 0 350 350"', 1)

        d9_raw = raw_data.get("chart_d9")
        d9_svg = d9_raw.get("svg", "") if isinstance(d9_raw, dict) else ""
        if d9_svg and "viewBox=" not in d9_svg:
            d9_svg = re.sub(
                r'<svg([^>]*)(width|height)="[^"]*"([^>]*)(width|height)="[^"]*"',
                r'<svg\1 viewBox="0 0 350 350"',
                d9_svg
            )
            if "viewBox=" not in d9_svg:
                d9_svg = d9_svg.replace("<svg", '<svg viewBox="0 0 350 350"', 1)

        # 3. Map Manglik
        manglik_raw = raw_data.get("manglik") or {}
        is_manglik = manglik_raw.get("is_present") or False
        manglik_data = {
            "response": {
                "is_present": is_manglik,
                "is_mangal_dosha_present": is_manglik,
                "mangal_dosha_type": manglik_raw.get("manglik_status") or "none",
                "manglik_present_rule": manglik_raw.get("manglik_report") or "",
                "manglik_cancel_rule": "Cancelled: " + str(manglik_raw.get("is_mars_manglik_cancelled", False)),
                "description": manglik_raw.get("manglik_report") or "Mars alignment analysis for Manglik Dosha."
            }
        }

        # 4. Map Kalsarp
        kalsarpa_raw = raw_data.get("kalsarpa") or {}
        is_kalsarpa = kalsarpa_raw.get("present") or False
        kalsarpa_data = {
            "response": {
                "is_present": is_kalsarpa,
                "type": kalsarpa_raw.get("type") if is_kalsarpa else "none",
                "one_line": kalsarpa_raw.get("one_line") or kalsarpa_raw.get("type") or "No Kaalsarp Dosha details available.",
                "description": kalsarpa_raw.get("one_line") or "Kaal Sarp Dosha status and details."
            }
        }

        # 5. Map Pitra
        pitra_raw = raw_data.get("pitra") or {}
        is_pitra = pitra_raw.get("is_pitri_dosha_present") or False
        pitra_data = {
            "response": {
                "is_present": is_pitra,
                "is_pitra_dosha_present": is_pitra,
                "one_line": pitra_raw.get("conclusion") or pitra_raw.get("description") or "Pitra Dosha analysis.",
                "description": pitra_raw.get("conclusion") or pitra_raw.get("description") or "Pitra Dosha analysis."
            }
        }

        # 6. Map Sade Sati
        sade_raw = raw_data.get("sade_sati") or {}
        is_sadhesati = False
        status_val = sade_raw.get("sadhesati_status")
        if isinstance(status_val, bool):
            is_sadhesati = status_val
        elif isinstance(status_val, str):
            is_sadhesati = status_val.lower() not in ("no", "false", "none", "")
        
        undergoing = sade_raw.get("is_undergoing_sadhesati")
        if isinstance(undergoing, str) and undergoing.lower().startswith("yes"):
            is_sadhesati = True

        sade_data = {
            "response": {
                "is_sadhesati": is_sadhesati,
                "is_undergoing_sadhesati": is_sadhesati,
                "sadhesati_status": "active" if is_sadhesati else "inactive",
                "description": sade_raw.get("is_undergoing_sadhesati") or sade_raw.get("what_is_sadhesati") or "Sade Sati status details."
            }
        }

        # 7. Map Gemstone Suggestions
        gems_raw = raw_data.get("gems") or {}
        def map_stone(stone):
            if not isinstance(stone, dict):
                return None
            return {
                "name": stone.get("name") or "Gemstone",
                "metal": stone.get("wear_metal") or "Silver/Gold",
                "finger": stone.get("wear_finger") or "Ring Finger"
            }
        
        life_stone = map_stone(gems_raw.get("LIFE") or gems_raw.get("life_stone"))
        lucky_stone = map_stone(gems_raw.get("LUCKY") or gems_raw.get("lucky_stone"))
        gems_data = {
            "response": {
                "life_stone": life_stone,
                "lucky_stone": lucky_stone
            }
        }

        # 8. Map Rudraksha Suggestion
        rudra_raw = raw_data.get("rudraksha") or {}
        rudra_data = {
            "response": {
                "recommendation": rudra_raw.get("recommend") or rudra_raw.get("name") or "Rudraksha recommendation",
                "detail": rudra_raw.get("detail") or "Detailed Rudraksha guidance is recommended based on birth charts."
            }
        }

        # 9. Map Vimshottari Dasha
        dasha_raw = raw_data.get("dasha") or []
        dasha_list = []
        if isinstance(dasha_raw, list):
            for item in dasha_raw:
                if isinstance(item, dict):
                    dasha_list.append({
                        "dasha": item.get("planet") or "Unknown",
                        "start": item.get("start") or "-",
                        "end": item.get("end") or "-"
                    })
        dasha_data = {
            "response": dasha_list
        }

        aggregated_data = {
            "planets": planets_data,
            "chart_d1": d1_svg,
            "chart_d9": d9_svg,
            "mangal_dosha": manglik_data,
            "kaalsarp_dosha": kalsarpa_data,
            "pitra_dosha": pitra_data,
            "sadhesati_status": sade_data,
            "gem_suggestion": gems_data,
            "rudraksha_suggestion": rudra_data,
            "vimshottari_dasha": dasha_data
        }

        await cache_manager.set(cache_key, aggregated_data, ttl=86400)
        return aggregated_data

    async def search_city(self, city_name: str) -> Any:
        """Search geo coordinates and timezone details for a city using AstrologyAPI.com's geo_details (restricted to India only)."""
        payload = {
            "place": city_name,
            "maxRows": 30
        }
        raw = await self._fetch_endpoint("/geo_details", payload)
        geonames = raw.get("geonames", []) if isinstance(raw, dict) else []
        
        mapped_cities = []
        for city in geonames:
            if not isinstance(city, dict):
                continue
            country = (city.get("country_code") or "").strip().upper()
            # Restrict to India (IN) only
            if country != "IN":
                continue
                
            name = city.get("place_name") or "Unknown"
            full_name = f"{name}, {country}" if country else name
            
            try:
                lat = float(city.get("latitude") or 0.0)
                lon = float(city.get("longitude") or 0.0)
            except ValueError:
                lat, lon = 0.0, 0.0
                
            # Restrict timezone to IST (5.5)
            tz_offset = 5.5
            
            mapped_cities.append({
                "name": name,
                "full_name": full_name,
                "coordinates": [lat, lon],
                "tz": tz_offset
            })
            
        return {"response": mapped_cities}

astrology_api_service = AstrologyApiService()
