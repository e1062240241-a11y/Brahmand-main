import json
import asyncio
from pathlib import Path
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/library/bhagavad-gita", tags=["Bhagavad Gita"])

BHAGAVAD_GITA_CHAPTER_DATA_DIR = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "bhavykhatri DharmicData bhavykhatri-AddTransForGita SrimadBhagvadGita"
)

_bhagavad_gita_chapter_cache: Dict[int, List[Dict[str, Any]]] = {}
_bhagavad_gita_chapters_summary_cache = None
_bhagavad_gita_chapters_full_cache = None


def _load_bhagavad_gita_chapter(chapter_number: int) -> List[Dict[str, Any]]:
    if chapter_number in _bhagavad_gita_chapter_cache:
        return _bhagavad_gita_chapter_cache[chapter_number]

    if chapter_number < 1 or chapter_number > 18:
        raise HTTPException(status_code=404, detail="Invalid Bhagavad Gita chapter")

    chapter_path = BHAGAVAD_GITA_CHAPTER_DATA_DIR / f"bhagavad_gita_chapter_{chapter_number}.json"
    if not chapter_path.exists():
        raise HTTPException(status_code=404, detail="Bhagavad Gita chapter file not found")

    try:
        with chapter_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to load Bhagavad Gita chapter")

    rows = payload.get("BhagavadGitaChapter")
    if not isinstance(rows, list):
        raise HTTPException(status_code=500, detail="Invalid Bhagavad Gita chapter format")

    normalized: List[Dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        normalized.append(
            {
                "chapter": row.get("chapter"),
                "verse": row.get("verse"),
                "text": row.get("text") or "",
                "translations": row.get("translations") if isinstance(row.get("translations"), dict) else {},
            }
        )

    _bhagavad_gita_chapter_cache[chapter_number] = normalized
    return normalized


@router.get("/chapter/{chapter_number}")
async def get_bhagavad_gita_chapter(chapter_number: int):
    if chapter_number in _bhagavad_gita_chapter_cache:
        verses = _bhagavad_gita_chapter_cache[chapter_number]
    else:
        verses = await asyncio.to_thread(_load_bhagavad_gita_chapter, chapter_number)
    return {
        "book": "bhagavad-gita",
        "chapter": chapter_number,
        "total_verses": len(verses),
        "verses": verses,
    }


@router.get("/all")
async def get_bhagavad_gita_all(summary: bool = True):
    global _bhagavad_gita_chapters_summary_cache, _bhagavad_gita_chapters_full_cache
    if summary and _bhagavad_gita_chapters_summary_cache is not None:
        return _bhagavad_gita_chapters_summary_cache
    if not summary and _bhagavad_gita_chapters_full_cache is not None:
        return _bhagavad_gita_chapters_full_cache

    results = []
    tasks = []
    for i in range(1, 19):
        if i in _bhagavad_gita_chapter_cache:
            results.append((i, _bhagavad_gita_chapter_cache[i]))
        else:
            tasks.append((i, asyncio.to_thread(_load_bhagavad_gita_chapter, i)))
            
    if tasks:
        indices, awaitables = zip(*tasks)
        loaded = await asyncio.gather(*awaitables)
        for idx, res in zip(indices, loaded):
            results.append((idx, res))
            
    results.sort(key=lambda x: x[0])
    ordered_results = [res for idx, res in results]
    
    if summary:
        chapters = {
            i: {
                "chapter": i,
                "total_verses": len(res),
                "verses_summary": f"Chapter {i} contains {len(res)} verses."
            }
            for i, res in enumerate(ordered_results, start=1)
        }
    else:
        chapters = {i: res for i, res in enumerate(ordered_results, start=1)}
    
    response_data = {"book": "bhagavad-gita", "chapters": chapters}
    if summary:
        _bhagavad_gita_chapters_summary_cache = response_data
    else:
        _bhagavad_gita_chapters_full_cache = response_data
        
    return response_data
