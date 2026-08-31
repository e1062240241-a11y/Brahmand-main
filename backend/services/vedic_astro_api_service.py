"""Vedic Astro API (api.vedicastroapi.com) integration service."""
import asyncio
import logging
import requests
from datetime import datetime
from typing import Any, Dict
from config.settings import settings
from utils.cache import cache_manager

logger = logging.getLogger(__name__)

class VedicAstroApiService:
    """Handles data fetch and caching for VedicAstroAPI endpoints."""

    BASE_URL = "https://api.vedicastroapi.com/v3-json"

    def __init__(self):
        self._api_key = settings.VEDIC_ASTRO_API_KEY
        self._request_lock = asyncio.Lock()

    def _cache_key(self, lat: float, lon: float, dob_str: str, tob_str: str, suffix: str) -> str:
        return f"vedic_astro_api:{suffix}:{dob_str}:{tob_str}:{round(lat, 3)}:{round(lon, 3)}"

    def _format_date(self, dob_str: str) -> str:
        """Robustly parse date in various formats and convert to DD/MM/YYYY."""
        if not dob_str:
            return datetime.now().strftime("%d/%m/%Y")
        
        cleaned = dob_str.strip()
        # If there's a T or space followed by time, extract just the date part (first 10 chars)
        if len(cleaned) > 10 and (cleaned[10] == 'T' or cleaned[10] == ' '):
            cleaned = cleaned[:10]
            
        # Try YYYY-MM-DD
        try:
            dt = datetime.strptime(cleaned, "%Y-%m-%d")
            return dt.strftime("%d/%m/%Y")
        except Exception:
            pass

        # Try DD/MM/YYYY
        try:
            dt = datetime.strptime(cleaned, "%d/%m/%Y")
            return dt.strftime("%d/%m/%Y")
        except Exception:
            pass

        # Try DD-MM-YYYY
        try:
            dt = datetime.strptime(cleaned, "%d-%m-%Y")
            return dt.strftime("%d/%m/%Y")
        except Exception:
            pass

        # Fallback to whatever was passed, but log a warning
        logger.warning("Could not parse date string: %s. Using as-is.", dob_str)
        return dob_str

    async def _fetch_json_endpoint(self, endpoint: str, params: Dict[str, Any]) -> Any:
        url = f"{self.BASE_URL}/{endpoint}"
        params["api_key"] = self._api_key
        
        def _request():
            return requests.get(url, params=params, timeout=15)

        try:
            response = await asyncio.to_thread(_request)
            if response.status_code >= 400:
                logger.error("VedicAstroAPI error: %s - %s", response.status_code, response.text)
                return {"error": f"Status {response.status_code}: {response.text}"}
            return response.json()
        except Exception as e:
            logger.error("VedicAstroAPI request failed: %s", e)
            return {"error": "An internal server error occurred while fetching vedic astrology data"}

    async def _fetch_svg_endpoint(self, endpoint: str, params: Dict[str, Any]) -> str:
        url = f"{self.BASE_URL}/{endpoint}"
        params["api_key"] = self._api_key
        
        def _request():
            return requests.get(url, params=params, timeout=15)

        try:
            response = await asyncio.to_thread(_request)
            if response.status_code >= 400:
                logger.error("VedicAstroAPI SVG error: %s", response.status_code)
                return ""
            svg_content = response.text
            if svg_content and "viewBox=" not in svg_content:
                import re
                svg_match = re.search(r'<svg([^>]*)>', svg_content)
                if svg_match:
                    attrs = svg_match.group(1)
                    w_match = re.search(r'width=["\'](\d+)(px)?["\']', attrs)
                    h_match = re.search(r'height=["\'](\d+)(px)?["\']', attrs)
                    w = w_match.group(1) if w_match else "500"
                    h = h_match.group(1) if h_match else "500"
                    new_attrs = attrs
                    new_attrs = re.sub(r'width=["\']\d+(px)?["\']', 'width="100%"', new_attrs)
                    new_attrs = re.sub(r'height=["\']\d+(px)?["\']', 'height="100%"', new_attrs)
                    new_attrs += f' viewBox="0 0 {w} {h}"'
                    svg_content = svg_content.replace(svg_match.group(0), f'<svg{new_attrs}>')
            return svg_content
        except Exception as e:
            logger.error("VedicAstroAPI SVG request failed: %s", e)
            return ""

    async def get_kundli_data(
        self,
        lat: float,
        lon: float,
        dob_str: str, # YYYY-MM-DD
        tob_str: str, # HH:MM
        tz: float = 5.5,
        lang: str = "en"
    ) -> Dict[str, Any]:
        """Fetch comprehensive Kundli, Charts, Doshas, Dashas, and Remedies from VedicAstroAPI."""
        formatted_dob = self._format_date(dob_str)
        cache_key = self._cache_key(lat, lon, formatted_dob, tob_str, "kundli_full")
        cached = await cache_manager.get(cache_key)
        if cached:
            return cached
        base_params = {
            "dob": formatted_dob,
            "tob": tob_str,
            "lat": lat,
            "lon": lon,
            "tz": tz,
            "lang": lang
        }

        # Define all endpoints we want to fetch
        tasks = {
            # 1. Planet Details
            "planets": self._fetch_json_endpoint("horoscope/planet-details", base_params.copy()),
            
            # 2. Charts (D1 and D9)
            "chart_d1": self._fetch_svg_endpoint("horoscope/chart-image", {**base_params, "div": "D1", "style": "north", "color": "#FF8C32"}),
            "chart_d9": self._fetch_svg_endpoint("horoscope/chart-image", {**base_params, "div": "D9", "style": "north", "color": "#FF8C32"}),
            
            # 3. Doshas
            "mangal_dosha": self._fetch_json_endpoint("dosha/mangal-dosh", base_params.copy()),
            "kaalsarp_dosha": self._fetch_json_endpoint("dosha/kaalsarp-dosh", base_params.copy()),
            "pitra_dosha": self._fetch_json_endpoint("dosha/pitra-dosh", base_params.copy()),
            "sadhesati_status": self._fetch_json_endpoint("extended-horoscope/current-sade-sati", base_params.copy()),
            
            # 4. Suggestions / Remedies
            "gem_suggestion": self._fetch_json_endpoint("extended-horoscope/gem-suggestion", base_params.copy()),
            "rudraksha_suggestion": self._fetch_json_endpoint("extended-horoscope/rudraksh-suggestion", base_params.copy()),
            
            # 5. Dashas
            "vimshottari_dasha": self._fetch_json_endpoint("dashas/current-mahadasha", base_params.copy())
        }

        # Execute all tasks in parallel
        task_names = list(tasks.keys())
        results = await asyncio.gather(*tasks.values())
        data = dict(zip(task_names, results))

        # Normalize planets response from dictionary to list
        planets_data = data.get("planets", {})
        if isinstance(planets_data, dict) and "response" in planets_data:
            resp = planets_data["response"]
            if isinstance(resp, dict):
                sorted_keys = sorted(resp.keys(), key=lambda x: int(x) if x.isdigit() else 999)
                planets_list = []
                for k in sorted_keys:
                    item = resp[k]
                    if isinstance(item, dict) and ("name" in item or "full_name" in item):
                        mapped_item = {
                            "name": item.get("full_name") or item.get("name"),
                            "norm_degree": item.get("local_degree"),
                            "sign": item.get("zodiac"),
                            "sign_lord": item.get("zodiac_lord"),
                            "nakshatra": item.get("nakshatra"),
                            "nakshatra_lord": item.get("nakshatra_lord"),
                            "house": item.get("house"),
                            "is_retro": "true" if item.get("retro") is True else "false"
                        }
                        planets_list.append(mapped_item)
                planets_data["response"] = planets_list

        # 1. Normalize pitra_dosha
        pitra_data = data.get("pitra_dosha", {})
        if isinstance(pitra_data, dict) and "response" in pitra_data:
            resp = pitra_data["response"]
            if isinstance(resp, dict):
                resp["is_pitra_dosha_present"] = resp.get("is_dosha_present", False)

        # 2. Normalize sadhesati_status
        sade_data = data.get("sadhesati_status", {})
        if isinstance(sade_data, dict) and "response" in sade_data:
            resp = sade_data["response"]
            if isinstance(resp, dict):
                # Check if undergoing any Sade Sati (shani_period_type not False)
                resp["is_undergoing_sadhesati"] = resp.get("shani_period_type") is not False

        # 3. Normalize gem_suggestion
        gem_data = data.get("gem_suggestion", {})
        if isinstance(gem_data, dict) and "response" in gem_data:
            resp = gem_data["response"]
            if isinstance(resp, dict) and "name" in resp:
                gem_detail = {
                    "name": resp.get("name"),
                    "metal": resp.get("metal", "Gold/Silver"),
                    "finger": resp.get("finger", "Ring finger")
                }
                gem_data["response"] = {
                    "life_stone": gem_detail,
                    "lucky_stone": gem_detail,
                    "benevolent_stone": gem_detail
                }

        # 4. Normalize rudraksha_suggestion
        rudra_data = data.get("rudraksha_suggestion", {})
        if isinstance(rudra_data, dict) and "response" in rudra_data:
            resp = rudra_data["response"]
            if isinstance(resp, dict):
                recommendation = resp.get("name", "Rudraksha")
                detail = resp.get("bot_response") or resp.get("mukhi_description") or ""
                rudra_data["response"] = {
                    "recommendation": recommendation,
                    "detail": detail
                }

        # 5. Normalize vimshottari_dasha
        dasha_data = data.get("vimshottari_dasha", {})
        if isinstance(dasha_data, dict) and "response" in dasha_data:
            resp = dasha_data["response"]
            if isinstance(resp, dict):
                dasha_list = []
                for dasha_type in ["mahadasha", "antardasha", "paryantardasha", "Shookshamadasha", "Pranadasha"]:
                    d_info = resp.get(dasha_type)
                    if isinstance(d_info, dict) and "name" in d_info:
                        dasha_list.append({
                            "dasha": f"{d_info['name']} ({dasha_type.capitalize()})",
                            "start": d_info.get("start", ""),
                            "end": d_info.get("end", "")
                        })
                dasha_data["response"] = dasha_list

        # Cache result for 24 hours
        await cache_manager.set(cache_key, data, ttl=86400)
        return data

    async def search_city(self, city_name: str) -> Any:
        """Search geo coordinates and timezone details for a city using VedicAstroAPI."""
        params = {"city": city_name}
        return await self._fetch_json_endpoint("utilities/geo-search", params)

vedic_astro_api_service = VedicAstroApiService()
