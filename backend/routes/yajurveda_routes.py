import json
import asyncio
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
_yajurveda_all_summary_cache = None
_yajurveda_all_full_cache = None


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
    verses = await asyncio.to_thread(_find_yajurveda_chapter, chapter_number)
    return {
        "book": "yajurveda",
        "chapter": chapter_number,
        "total_verses": len(verses),
        "verses": verses,
    }


@router.get("/all")
async def get_yajurveda_all(summary: bool = True):
    global _yajurveda_all_summary_cache, _yajurveda_all_full_cache
    if summary and _yajurveda_all_summary_cache is not None:
        return _yajurveda_all_summary_cache
    if not summary and _yajurveda_all_full_cache is not None:
        return _yajurveda_all_full_cache

    kanva, madhyadina = await asyncio.gather(
        asyncio.to_thread(_load_yajurveda_kanva),
        asyncio.to_thread(_load_yajurveda_madhyadina)
    )
    all_rows = [row.copy() for row in kanva] + [row.copy() for row in madhyadina]
    chapters: Dict[int, list] = {}
    for row in all_rows:
        ch = row.get("chapter")
        if isinstance(ch, int):
            chapters.setdefault(ch, []).append(row)
    # renumber verses per chapter
    for ch in chapters:
        for idx, v in enumerate(chapters[ch]):
            v["verse"] = idx + 1
    if summary:
        chapters_summary = {
            ch: {
                "chapter": ch,
                "total_verses": len(verses),
                "verses_summary": f"Chapter {ch} contains {len(verses)} verses."
            }
            for ch, verses in chapters.items()
        }
        response_data = {"book": "yajurveda", "chapters": chapters_summary}
    else:
        response_data = {"book": "yajurveda", "chapters": chapters}
        
    if summary:
        _yajurveda_all_summary_cache = response_data
    else:
        _yajurveda_all_full_cache = response_data
    return response_data
