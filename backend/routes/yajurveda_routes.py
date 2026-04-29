import json
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/library/yajurveda", tags=["Yajurveda"])

YAJURVEDA_DATA_DIR = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "bhavykhatri DharmicData bhavykhatri-AddTransForGita Yajurveda"
)
YAJURVEDA_KANVA_FILE = "vajasneyi_kanva_samhita_chapters.json"
YAJURVEDA_MADHYADINA_FILE = "vajasneyi_madhyadina_samhita.json"

_yajurveda_kanva_cache: List[Dict[str, Any]] = []
_yajurveda_madhyadina_cache: List[Dict[str, Any]] = []


def _load_yajurveda_file(filename: str) -> List[Dict[str, Any]]:
    file_path = YAJURVEDA_DATA_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Yajurveda data file not found: {filename}")

    try:
        with file_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except Exception:
        raise HTTPException(status_code=500, detail=f"Failed to load Yajurveda data: {filename}")

    if not isinstance(payload, list):
        raise HTTPException(status_code=500, detail=f"Invalid Yajurveda data format: {filename}")

    normalized: List[Dict[str, Any]] = []
    for row in payload:
        if not isinstance(row, dict):
            continue

        chapter_value = row.get("chapter") if row.get("chapter") is not None else row.get("adhyaya")
        if not isinstance(chapter_value, int):
            continue

        normalized.append(
            {
                "chapter": chapter_value,
                "verse": 1,
                "text": row.get("text") or "",
                "type": str(row.get("samhita") or ""),
                "samhita": row.get("samhita") or "",
                "translations": {},
            }
        )

    return normalized


def _load_yajurveda_kanva() -> List[Dict[str, Any]]:
    global _yajurveda_kanva_cache
    if _yajurveda_kanva_cache:
        return _yajurveda_kanva_cache
    _yajurveda_kanva_cache = _load_yajurveda_file(YAJURVEDA_KANVA_FILE)
    return _yajurveda_kanva_cache


def _load_yajurveda_madhyadina() -> List[Dict[str, Any]]:
    global _yajurveda_madhyadina_cache
    if _yajurveda_madhyadina_cache:
        return _yajurveda_madhyadina_cache
    _yajurveda_madhyadina_cache = _load_yajurveda_file(YAJURVEDA_MADHYADINA_FILE)
    return _yajurveda_madhyadina_cache


def _find_yajurveda_chapter(chapter_number: int) -> List[Dict[str, Any]]:
    if chapter_number < 1:
        raise HTTPException(status_code=404, detail="Invalid Yajurveda chapter number")

    results: List[Dict[str, Any]] = []
    for row in _load_yajurveda_kanva():
        if row.get("chapter") == chapter_number:
            results.append({**row, "verse": len(results) + 1})

    for row in _load_yajurveda_madhyadina():
        if row.get("chapter") == chapter_number:
            results.append({**row, "verse": len(results) + 1})

    if not results:
        raise HTTPException(status_code=404, detail="Yajurveda chapter not found")

    return results


@router.get("/chapter/{chapter_number}")
async def get_yajurveda_chapter(chapter_number: int):
    verses = _find_yajurveda_chapter(chapter_number)
    return {
        "book": "yajurveda",
        "chapter": chapter_number,
        "total_verses": len(verses),
        "verses": verses,
    }
