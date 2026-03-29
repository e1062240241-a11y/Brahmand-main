"""Prokerala Astrology aggregation service."""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import requests

from config.settings import settings
from utils.cache import cache_manager

logger = logging.getLogger(__name__)


class ProkeralaAstrologyService:
    """Handles auth, data fetch, and caching for Prokerala astrology endpoints."""

    ENDPOINTS = {
        "birth_details": "/v2/astrology/birth-details",
        "kundli_advanced": "/v2/astrology/kundli/advanced",
        "kaal_sarp_dosha": "/v2/astrology/kaal-sarp-dosha",
        "mangal_dosha": "/v2/astrology/mangal-dosha",
        "chart": "/v2/astrology/chart",
        "papasamyam": "/v2/astrology/papasamyam",
        "planet_position": "/v2/astrology/planet-position",
        "upagraha_position": "/v2/astrology/upagraha-position",
        "sade_sati_advanced": "/v2/astrology/sade-sati/advanced",
        "yoga": "/v2/astrology/yoga",
        "dasha_periods": "/v2/astrology/dasha-periods",
        "planet_relationship": "/v2/astrology/planet-relationship",
        "ashtakavarga": "/v2/astrology/ashtakavarga",
    }
    ENDPOINT_LABELS = {
        "birth_details": "Birth Details",
        "kundli_advanced": "Advanced Kundli",
        "kaal_sarp_dosha": "Kaal Sarp Dosha",
        "mangal_dosha": "Mangal Dosha",
        "chart": "Chart",
        "papasamyam": "Papasamyam",
        "planet_position": "Planet Position",
        "upagraha_position": "Upagraha Position",
        "sade_sati_advanced": "Sade Sati",
        "yoga": "Yoga",
        "dasha_periods": "Dasha Periods",
        "planet_relationship": "Planet Relationship",
        "ashtakavarga": "Ashtakavarga",
    }
    DEFAULT_ENDPOINTS = [
        "birth_details",
        "kundli_advanced",
    ]
    ENDPOINT_PRIORITY = [
        "birth_details",
        "kundli_advanced",
        "planet_position",
        "chart",
        "yoga",
        "dasha_periods",
        "planet_relationship",
        "mangal_dosha",
        "kaal_sarp_dosha",
        "sade_sati_advanced",
        "upagraha_position",
        "papasamyam",
        "ashtakavarga",
    ]

    def __init__(self):
        self._token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None
        self._token_lock = asyncio.Lock()
        self._request_lock = asyncio.Lock()
        self._last_provider_call_at: Optional[datetime] = None

    @staticmethod
    def _round_coords(lat: float, lng: float) -> Tuple[float, float]:
        return round(lat, 3), round(lng, 3)

    def _cache_key(self, lat: float, lng: float, datetime_str: str, ayanamsa: int, la: Optional[str], endpoint_keys: List[str]) -> str:
        rounded_lat, rounded_lng = self._round_coords(lat, lng)
        endpoint_suffix = ",".join(endpoint_keys)
        language = (la or "").strip().lower() or "default"
        return f"prokerala:astrology:{datetime_str}:{rounded_lat}:{rounded_lng}:{ayanamsa}:{language}:{endpoint_suffix}"

    @staticmethod
    def _seconds_until_next_midnight_utc() -> int:
        now = datetime.utcnow()
        next_midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        return max(60, int((next_midnight - now).total_seconds()))

    async def _get_access_token(self) -> str:
        if not settings.PROKERALA_CLIENT_ID or not settings.PROKERALA_CLIENT_SECRET:
            raise ValueError("Prokerala credentials missing: set PROKERALA_CLIENT_ID and PROKERALA_CLIENT_SECRET")

        now = datetime.utcnow()
        if self._token and self._token_expires_at and now < self._token_expires_at:
            return self._token

        async with self._token_lock:
            now = datetime.utcnow()
            if self._token and self._token_expires_at and now < self._token_expires_at:
                return self._token

            token_url = f"{settings.PROKERALA_BASE_URL}/token"
            payload = {
                "grant_type": "client_credentials",
                "client_id": settings.PROKERALA_CLIENT_ID,
                "client_secret": settings.PROKERALA_CLIENT_SECRET,
            }

            def _request_token():
                return requests.post(token_url, data=payload, timeout=20)

            response = await asyncio.to_thread(_request_token)
            if response.status_code >= 400:
                raise ValueError(f"Prokerala token request failed: {response.status_code} {response.text}")

            token_data = response.json()
            access_token = token_data.get("access_token")
            expires_in = int(token_data.get("expires_in", 3600))

            if not access_token:
                raise ValueError("Prokerala token response missing access_token")

            self._token = access_token
            self._token_expires_at = datetime.utcnow() + timedelta(seconds=max(60, expires_in - 60))
            return access_token

    async def _fetch_endpoint(
        self,
        endpoint: str,
        token: str,
        lat: float,
        lng: float,
        datetime_str: str,
        ayanamsa: int,
        tz: str,
        la: Optional[str],
    ) -> Dict[str, Any]:
        url = f"{settings.PROKERALA_BASE_URL}{endpoint}"
        query = {
            "coordinates": f"{lat},{lng}",
            "datetime": datetime_str,
            "ayanamsa": ayanamsa,
            "timezone": tz,
        }
        if la:
            query["la"] = la
        headers = {"Authorization": f"Bearer {token}"}

        def _request_data():
            return requests.get(url, headers=headers, params=query, timeout=25)

        response = await asyncio.to_thread(_request_data)
        if response.status_code >= 400:
            raise ValueError(f"{response.status_code}: {response.text}")

        return response.json()

    async def _respect_provider_rate_limit(self):
        min_gap = max(0.2, float(settings.PROKERALA_MIN_REQUEST_GAP_SECONDS))
        async with self._request_lock:
            if self._last_provider_call_at is not None:
                elapsed = (datetime.utcnow() - self._last_provider_call_at).total_seconds()
                wait_seconds = max(0, min_gap - elapsed)
                if wait_seconds > 0:
                    await asyncio.sleep(wait_seconds)
            self._last_provider_call_at = datetime.utcnow()

    @staticmethod
    def _unwrap_source_data(source: Any) -> Any:
        if isinstance(source, dict) and source.get("data") is not None:
            return source["data"]
        return source

    @classmethod
    def _get_nested_value(cls, source: Any, *path: str) -> Any:
        pointer = cls._unwrap_source_data(source)
        for key in path:
            if not isinstance(pointer, dict):
                return None
            pointer = pointer.get(key)
            if pointer is None:
                return None
        return pointer

    @classmethod
    def _pick_first_value(cls, source: Any, paths: Tuple[Tuple[str, ...], ...]) -> Any:
        for path in paths:
            value = cls._get_nested_value(source, *path)
            if value not in (None, "", [], {}):
                return value
        return None

    @staticmethod
    def _format_time_value(value: Any) -> Optional[str]:
        if value in (None, ""):
            return None
        if isinstance(value, str):
            stripped = value.strip()
            for parser in (
                lambda v: datetime.fromisoformat(v.replace("Z", "+00:00")),
                lambda v: datetime.strptime(v, "%H:%M:%S"),
                lambda v: datetime.strptime(v, "%H:%M"),
            ):
                try:
                    return parser(stripped).strftime("%I:%M %p").lstrip("0")
                except Exception:
                    continue
            return stripped
        return str(value)

    @classmethod
    def _format_value(cls, value: Any) -> Optional[str]:
        if value in (None, ""):
            return None
        if isinstance(value, bool):
            return "Yes" if value else "No"
        if isinstance(value, (int, float)):
            return str(value)
        if isinstance(value, str):
            return value.strip() or None
        if isinstance(value, list):
            formatted_items = [cls._format_value(item) for item in value[:3]]
            cleaned_items = [item for item in formatted_items if item]
            return ", ".join(cleaned_items) if cleaned_items else None
        if isinstance(value, dict):
            for key in ("name", "title", "result", "status", "value", "description", "sign", "house", "planet", "dosha"):
                candidate = value.get(key)
                if candidate not in (None, "", [], {}):
                    return cls._format_value(candidate)
            start = cls._pick_first_value(value, (("start",), ("start_time",), ("from",)))
            end = cls._pick_first_value(value, (("end",), ("end_time",), ("to",)))
            if start or end:
                start_text = cls._format_time_value(start) or "-"
                end_text = cls._format_time_value(end) or "-"
                return f"{start_text} - {end_text}"
            compact_pairs = []
            for key, item in value.items():
                if len(compact_pairs) >= 2:
                    break
                formatted = cls._format_value(item)
                if formatted:
                    compact_pairs.append(f"{key.replace('_', ' ').title()}: {formatted}")
            return ", ".join(compact_pairs) if compact_pairs else None
        return str(value)

    @classmethod
    def _normalize_endpoint_keys(cls, endpoint_keys: Optional[List[str]]) -> List[str]:
        candidates = endpoint_keys or cls.DEFAULT_ENDPOINTS
        normalized: List[str] = []
        for key in candidates:
            if key in cls.ENDPOINTS and key not in normalized:
                normalized.append(key)

        if not normalized:
            normalized = list(cls.DEFAULT_ENDPOINTS)

        prioritized = [key for key in cls.ENDPOINT_PRIORITY if key in normalized]
        max_endpoints = max(1, int(settings.PROKERALA_MAX_ENDPOINTS_PER_CALL))
        if endpoint_keys:
            max_endpoints = max(max_endpoints, len(prioritized))
        return prioritized[:max_endpoints]

    @classmethod
    def _build_available_endpoints(cls) -> List[Dict[str, str]]:
        return [
            {"key": key, "label": cls.ENDPOINT_LABELS.get(key, key.replace("_", " ").title())}
            for key in cls.ENDPOINT_PRIORITY
            if key not in cls.DEFAULT_ENDPOINTS
        ]

    @classmethod
    def _flatten_for_display(cls, value: Any, prefix: str = "") -> List[Dict[str, str]]:
        rows: List[Dict[str, str]] = []
        if value in (None, "", [], {}):
            return rows

        if isinstance(value, dict):
            if "data" in value and value.get("data") is not None:
                return cls._flatten_for_display(value["data"], prefix)

            for key, item in value.items():
                label = key.replace("_", " ").title()
                full_label = f"{prefix} {label}".strip()
                if isinstance(item, (dict, list)):
                    rows.extend(cls._flatten_for_display(item, full_label))
                    continue
                formatted = cls._format_value(item)
                if formatted:
                    rows.append({"label": full_label, "value": formatted})
            return rows[:24]

        if isinstance(value, list):
            for index, item in enumerate(value[:10], start=1):
                item_prefix = f"{prefix} {index}".strip()
                rows.extend(cls._flatten_for_display(item, item_prefix))
            return rows[:24]

        formatted = cls._format_value(value)
        if formatted:
            rows.append({"label": prefix or "Value", "value": formatted})
        return rows

    @classmethod
    def _build_detail_sections(cls, sources: Dict[str, Any]) -> List[Dict[str, Any]]:
        sections: List[Dict[str, Any]] = []
        for key in cls.ENDPOINT_PRIORITY:
            if key not in sources:
                continue
            rows = cls._flatten_for_display(sources[key])
            sections.append({
                "key": key,
                "title": cls.ENDPOINT_LABELS.get(key, key.replace("_", " ").title()),
                "rows": rows,
            })
        return sections

    @classmethod
    def _build_summary_rows(cls, sources: Dict[str, Any]) -> Dict[str, Any]:
        birth_details = cls._unwrap_source_data(sources.get("birth_details"))
        kundli = cls._unwrap_source_data(sources.get("kundli_advanced"))

        def row(label: str, value: Any) -> Optional[Dict[str, str]]:
            formatted = cls._format_value(value)
            if not formatted:
                return None
            return {"label": label, "value": formatted}

        overview_candidates = [
            row("Ayanamsa", cls._pick_first_value(birth_details, (("ayanamsa",),))),
            row("Nakshatra", cls._pick_first_value(birth_details, (("nakshatra", "name"), ("nakshatra",), ("birth_star",)))),
            row("Tithi", cls._pick_first_value(birth_details, (("tithi", "name"), ("tithi",)))),
            row("Day", cls._pick_first_value(birth_details, (("weekday",), ("vaara",), ("day",)))),
        ]
        highlights_candidates = [
            row("Ascendant", cls._pick_first_value(kundli, (("ascendant",), ("lagna", "name"), ("lagna",)))),
            row("Moon Sign", cls._pick_first_value(kundli, (("moon_sign",), ("rasi", "name"), ("rasi",)))),
            row("Sun Sign", cls._pick_first_value(kundli, (("sun_sign",),))),
            row("Ganam", cls._pick_first_value(kundli, (("ganam",), ("gana",)))),
            row("Yoni", cls._pick_first_value(kundli, (("yoni",),))),
            row("Nadi", cls._pick_first_value(kundli, (("nadi",),))),
        ]
        insight_candidates = [
            row("Birth Place", cls._pick_first_value(birth_details, (("place",), ("location", "place"), ("location", "name")))),
            row("Timezone", cls._pick_first_value(birth_details, (("timezone",),))),
            row("Latitude", cls._pick_first_value(birth_details, (("location", "latitude"), ("latitude",)))),
            row("Longitude", cls._pick_first_value(birth_details, (("location", "longitude"), ("longitude",)))),
        ]

        overview = [item for item in overview_candidates if item]
        highlights = [item for item in highlights_candidates if item]
        insights = [item for item in insight_candidates if item]
        headline_parts = [item["value"] for item in highlights[:2]]

        return {
            "headline": " | ".join(headline_parts) if headline_parts else None,
            "overview": overview,
            "highlights": highlights,
            "insights": insights,
        }

    @staticmethod
    def _is_sandbox_date_error(error_text: str) -> bool:
        normalized = (error_text or "").lower()
        return "sandbox" in normalized and "jan" in normalized and "1" in normalized

    def _normalize_datetime_for_sandbox(self, datetime_str: str) -> str:
        if not settings.PROKERALA_SANDBOX_MODE:
            return datetime_str
        try:
            parsed = datetime.fromisoformat(datetime_str.replace("Z", "+00:00"))
            parsed = parsed.replace(month=1, day=1)
            return parsed.isoformat()
        except Exception:
            return datetime_str

    def _build_empty_payload(
        self,
        lat: float,
        lng: float,
        datetime_str: str,
        ayanamsa: int,
        tz: str,
        la: Optional[str],
    ) -> Dict[str, Any]:
        return {
            "datetime": datetime_str,
            "coordinates": {"latitude": lat, "longitude": lng},
            "timezone": tz,
            "ayanamsa": ayanamsa,
            "la": la,
            "sources": {},
            "errors": {},
            "summary": {
                "headline": None,
                "overview": [],
                "highlights": [],
                "insights": [],
            },
            "fetched_at": datetime.utcnow().isoformat() + "Z",
        }

    async def _fetch_single_endpoint_with_retry(
        self,
        endpoint_path: str,
        token: str,
        lat: float,
        lng: float,
        datetime_str: str,
        ayanamsa: int,
        tz: str,
        la: Optional[str],
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], str]:
        await self._respect_provider_rate_limit()
        try:
            result = await self._fetch_endpoint(endpoint_path, token, lat, lng, datetime_str, ayanamsa, tz, la)
            return result, None, datetime_str
        except Exception as exc:
            error_text = str(exc)
            if self._is_sandbox_date_error(error_text):
                retry_datetime = self._normalize_datetime_for_sandbox(datetime_str)
                await self._respect_provider_rate_limit()
                try:
                    result = await self._fetch_endpoint(endpoint_path, token, lat, lng, retry_datetime, ayanamsa, tz, la)
                    return result, None, retry_datetime
                except Exception as retry_exc:
                    return None, str(retry_exc), retry_datetime
            return None, error_text, datetime_str

    async def _fetch_progressively(
        self,
        lat: float,
        lng: float,
        datetime_str: str,
        ayanamsa: int,
        tz: str,
        la: Optional[str],
        endpoint_keys: List[str],
    ) -> Dict[str, Any]:
        payload = self._build_empty_payload(lat, lng, datetime_str, ayanamsa, tz, la)
        token = await self._get_access_token()
        endpoint_results: Dict[str, Any] = {}
        endpoint_errors: Dict[str, str] = {}
        effective_datetime = datetime_str

        for endpoint_key in endpoint_keys:
            endpoint_path = self.ENDPOINTS[endpoint_key]
            result, error_text, used_datetime = await self._fetch_single_endpoint_with_retry(
                endpoint_path=endpoint_path,
                token=token,
                lat=lat,
                lng=lng,
                datetime_str=effective_datetime,
                ayanamsa=ayanamsa,
                tz=tz,
                la=la,
            )
            effective_datetime = used_datetime
            if result is not None:
                endpoint_results[endpoint_key] = result
            else:
                endpoint_errors[endpoint_key] = error_text or "Unknown provider error"

        payload["datetime"] = effective_datetime
        payload["sources"] = endpoint_results
        payload["errors"] = endpoint_errors
        payload["summary"] = self._build_summary_rows(endpoint_results)
        payload["detail_sections"] = self._build_detail_sections(endpoint_results)
        payload["available_endpoints"] = self._build_available_endpoints()
        payload["meta"] = {
            "endpoints_total": len(endpoint_keys),
            "endpoints_loaded": len(endpoint_results),
            "endpoints_pending": max(0, len(endpoint_keys) - len(endpoint_results)),
            "is_complete": len(endpoint_results) == len(endpoint_keys),
            "request_gap_seconds": max(0.2, float(settings.PROKERALA_MIN_REQUEST_GAP_SECONDS)),
            "max_endpoints_per_call": max(1, int(settings.PROKERALA_MAX_ENDPOINTS_PER_CALL)),
            "sandbox_mode": settings.PROKERALA_SANDBOX_MODE,
            "endpoints_requested": endpoint_keys,
        }
        payload["fetched_at"] = datetime.utcnow().isoformat() + "Z"

        return payload

    async def get_aggregated_astrology(
        self,
        lat: float,
        lng: float,
        datetime_str: str,
        ayanamsa: int = 1,
        force_refresh: bool = False,
        tz: Optional[str] = None,
        la: Optional[str] = None,
        endpoint_keys: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        if ayanamsa not in (1, 3, 5):
            raise ValueError("Ayanamsa must be one of 1 (Lahiri), 3 (Raman), or 5 (KP)")

        target_datetime = self._normalize_datetime_for_sandbox(datetime_str)
        timezone = tz or settings.PROKERALA_DEFAULT_TZ
        normalized_endpoint_keys = self._normalize_endpoint_keys(endpoint_keys)
        cache_key = self._cache_key(lat, lng, target_datetime, ayanamsa, la, normalized_endpoint_keys)
        cached = None

        if not force_refresh:
            cached = await cache_manager.get(cache_key)
            if isinstance(cached, dict) and cached.get("meta", {}).get("is_complete"):
                meta = cached.get("meta", {})
                summary = self._build_summary_rows(cached.get("sources", {}))
                detail_sections = cached.get("detail_sections")
                if not isinstance(detail_sections, list):
                    detail_sections = self._build_detail_sections(cached.get("sources", {}))
                return {
                    **cached,
                    "summary": summary,
                    "detail_sections": detail_sections,
                    "available_endpoints": self._build_available_endpoints(),
                    "cache": {
                        "hit": True,
                        "key": cache_key,
                    },
                    "meta": {
                        **meta,
                        "sandbox_mode": settings.PROKERALA_SANDBOX_MODE,
                    },
                }

        try:
            fresh_payload = await self._fetch_progressively(
                lat=lat,
                lng=lng,
                datetime_str=target_datetime,
                ayanamsa=ayanamsa,
                tz=timezone,
                la=la,
                endpoint_keys=normalized_endpoint_keys,
            )
        except Exception:
            if isinstance(cached, dict):
                meta = cached.get("meta", {})
                summary = self._build_summary_rows(cached.get("sources", {}))
                detail_sections = cached.get("detail_sections")
                if not isinstance(detail_sections, list):
                    detail_sections = self._build_detail_sections(cached.get("sources", {}))
                return {
                    **cached,
                    "summary": summary,
                    "detail_sections": detail_sections,
                    "available_endpoints": self._build_available_endpoints(),
                    "cache": {
                        "hit": True,
                        "key": cache_key,
                        "stale": True,
                    },
                    "meta": {
                        **meta,
                        "sandbox_mode": settings.PROKERALA_SANDBOX_MODE,
                    },
                }
            raise

        if fresh_payload["meta"]["is_complete"]:
            ttl = self._seconds_until_next_midnight_utc()
            await cache_manager.set(cache_key, fresh_payload, ttl=ttl)

        return {
            **fresh_payload,
            "cache": {
                "hit": False,
                "key": cache_key,
                "ttl_seconds": self._seconds_until_next_midnight_utc(),
            },
        }


prokerala_astrology_service = ProkeralaAstrologyService()
