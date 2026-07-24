import json
import asyncio
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/library/atharvaved", tags=["Atharvaved"])

ATHARVA_VEDA_DATA_DIR = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "bhavykhatri DharmicData bhavykhatri-AddTransForGita AtharvaVeda"
)

_atharvaved_kaanda_cache: Dict[int, List[Dict[str, Any]]] = {}
_atharvaved_all_summary_cache = None
_atharvaved_all_full_cache = None


def _load_atharvaved_kaanda(kaanda_number: int) -> List[Dict[str, Any]]:
    if kaanda_number in _atharvaved_kaanda_cache:
        return _atharvaved_kaanda_cache[kaanda_number]

    if kaanda_number < 1 or kaanda_number > 20:
        raise HTTPException(status_code=404, detail="Invalid Atharvaved kaanda number")

    kaanda_path = ATHARVA_VEDA_DATA_DIR / f"atharvaveda_kaanda_{kaanda_number}.json"
    if not kaanda_path.exists():
        raise HTTPException(status_code=404, detail="Atharvaved kaanda file not found")

    try:
        with kaanda_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to load Atharvaved kaanda")

    if not isinstance(payload, list):
        raise HTTPException(status_code=500, detail="Invalid Atharvaved kaanda format")

    normalized: List[Dict[str, Any]] = []
    for row in payload:
        if not isinstance(row, dict):
            continue
        verse_number = row.get("sukta")
        if not isinstance(verse_number, int):
            verse_number = len(normalized) + 1
        normalized.append(
            {
                "chapter": kaanda_number,
                "verse": verse_number,
                "text": row.get("text") or "",
                "type": row.get("veda") or "",
                "samhita": row.get("samhita") or "",
                "kaand": row.get("kaanda") or kaanda_number,
                "translations": {},
            }
        )

    _atharvaved_kaanda_cache[kaanda_number] = normalized
    return normalized


@router.get("/chapter/{kaanda_number}")
async def get_atharvaved_kaanda(kaanda_number: int):
    if kaanda_number in _atharvaved_kaanda_cache:
        verses = _atharvaved_kaanda_cache[kaanda_number]
    else:
        verses = await asyncio.to_thread(_load_atharvaved_kaanda, kaanda_number)
    return {
        "book": "atharvaved",
        "chapter": kaanda_number,
        "total_verses": len(verses),
        "verses": verses,
    }


@router.get("/all")
async def get_atharvaved_all(summary: bool = True):
    global _atharvaved_all_summary_cache, _atharvaved_all_full_cache
    if summary and _atharvaved_all_summary_cache is not None:
        return _atharvaved_all_summary_cache
    if not summary and _atharvaved_all_full_cache is not None:
        return _atharvaved_all_full_cache

    results = []
    tasks = []
    for i in range(1, 21):
        if i in _atharvaved_kaanda_cache:
            results.append((i, _atharvaved_kaanda_cache[i]))
        else:
            tasks.append((i, asyncio.to_thread(_load_atharvaved_kaanda, i)))
            
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
                "verses_summary": f"Kaanda {i} contains {len(res)} verses."
            }
            for i, res in enumerate(ordered_results, start=1)
        }
    else:
        chapters = {i: res for i, res in enumerate(ordered_results, start=1)}
        
    response_data = {"book": "atharvaved", "chapters": chapters}
    if summary:
        _atharvaved_all_summary_cache = response_data
    else:
        _atharvaved_all_full_cache = response_data
    return response_data
