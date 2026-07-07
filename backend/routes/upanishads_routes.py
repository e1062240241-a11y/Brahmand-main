import json
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
    all_verses = _load_upanishads()
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
async def get_upanishads_all():
    all_verses = _load_upanishads()
    chapters: Dict[int, list] = {}
    for v in all_verses:
        ch = v.get("chapter")
        if isinstance(ch, int):
            chapters.setdefault(ch, []).append(v)
    return {"book": "upanishads", "chapters": chapters}
