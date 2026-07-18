import json
import asyncio
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/library/upanishads", tags=["Upanishads"])

UPANISHADS_DATA_FILE = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "upanishads_data.json"
)

_upanishads_cache: List[Dict[str, Any]] = []
_upanishads_all_summary_cache = None
_upanishads_all_full_cache = None


def _load_upanishads() -> List[Dict[str, Any]]:
    global _upanishads_cache
    if _upanishads_cache:
        return _upanishads_cache

    if not UPANISHADS_DATA_FILE.exists():
        raise HTTPException(status_code=404, detail="Upanishads data file not found")

    try:
        with UPANISHADS_DATA_FILE.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to load Upanishads data")

    if not isinstance(payload, list):
        raise HTTPException(status_code=500, detail="Invalid Upanishads data format")

    _upanishads_cache = payload
    return _upanishads_cache


@router.get("/chapter/{chapter_number}")
async def get_upanishad_chapter(chapter_number: int):
    if _upanishads_cache:
        all_verses = _upanishads_cache
    else:
        all_verses = await asyncio.to_thread(_load_upanishads)
        
    chapter_verses = [v for v in all_verses if v.get("chapter") == chapter_number]
    
    if not chapter_verses:
        raise HTTPException(status_code=404, detail="Upanishad chapter not found")

    return {
        "book": "upanishads",
        "chapter": chapter_number,
        "total_verses": len(chapter_verses),
        "verses": chapter_verses,
    }


@router.get("/all")
async def get_upanishads_all(summary: bool = True):
    global _upanishads_all_summary_cache, _upanishads_all_full_cache
    if summary and _upanishads_all_summary_cache is not None:
        return _upanishads_all_summary_cache
    if not summary and _upanishads_all_full_cache is not None:
        return _upanishads_all_full_cache

    if _upanishads_cache:
        all_verses = _upanishads_cache
    else:
        all_verses = await asyncio.to_thread(_load_upanishads)
    chapters: Dict[int, list] = {}
    for v in all_verses:
        ch = v.get("chapter")
        if isinstance(ch, int):
            chapters.setdefault(ch, []).append(v)
    if summary:
        chapters_summary = {
            ch: {
                "chapter": ch,
                "total_verses": len(verses),
                "verses_summary": f"Chapter {ch} contains {len(verses)} verses."
            }
            for ch, verses in chapters.items()
        }
        response_data = {"book": "upanishads", "chapters": chapters_summary}
    else:
        response_data = {"book": "upanishads", "chapters": chapters}
        
    if summary:
        _upanishads_all_summary_cache = response_data
    else:
        _upanishads_all_full_cache = response_data
    return response_data
