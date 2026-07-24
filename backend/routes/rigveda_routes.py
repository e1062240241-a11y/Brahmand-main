import json
import asyncio
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/library/rigveda", tags=["Rigveda"])

RIGVEDA_DATA_DIR = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "bhavykhatri DharmicData bhavykhatri-AddTransForGita Rigveda"
)

_rigveda_mandala_cache: Dict[int, List[Dict[str, Any]]] = {}
_rigveda_all_summary_cache = None
_rigveda_all_full_cache = None


def _load_rigveda_mandala(mandala_number: int) -> List[Dict[str, Any]]:
    if mandala_number in _rigveda_mandala_cache:
        return _rigveda_mandala_cache[mandala_number]

    if mandala_number < 1 or mandala_number > 10:
        raise HTTPException(status_code=404, detail="Invalid Rigveda mandala number")

    mandala_path = RIGVEDA_DATA_DIR / f"rigveda_mandala_{mandala_number}.json"
    if not mandala_path.exists():
        raise HTTPException(status_code=404, detail="Rigveda mandala file not found")

    try:
        with mandala_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to load Rigveda mandala")

    if not isinstance(payload, list):
        raise HTTPException(status_code=500, detail="Invalid Rigveda mandala format")

    normalized: List[Dict[str, Any]] = []
    for row in payload:
        if not isinstance(row, dict):
            continue
        verse_number = row.get("sukta")
        if not isinstance(verse_number, int):
            verse_number = len(normalized) + 1
        normalized.append(
            {
                "chapter": mandala_number,
                "verse": verse_number,
                "text": row.get("text") or "",
                "type": "",
                "mandala": row.get("mandala") or mandala_number,
                "sukta": row.get("sukta") or verse_number,
                "translations": {},
            }
        )

    _rigveda_mandala_cache[mandala_number] = normalized
    return normalized


@router.get("/chapter/{mandala_number}")
async def get_rigveda_mandala(mandala_number: int):
    if mandala_number in _rigveda_mandala_cache:
        verses = _rigveda_mandala_cache[mandala_number]
    else:
        verses = await asyncio.to_thread(_load_rigveda_mandala, mandala_number)
    return {
        "book": "rigveda",
        "chapter": mandala_number,
        "total_verses": len(verses),
        "verses": verses,
    }


@router.get("/all")
async def get_rigveda_all(summary: bool = True):
    global _rigveda_all_summary_cache, _rigveda_all_full_cache
    if summary and _rigveda_all_summary_cache is not None:
        return _rigveda_all_summary_cache
    if not summary and _rigveda_all_full_cache is not None:
        return _rigveda_all_full_cache

    results = []
    tasks = []
    for i in range(1, 11):
        if i in _rigveda_mandala_cache:
            results.append((i, _rigveda_mandala_cache[i]))
        else:
            tasks.append((i, asyncio.to_thread(_load_rigveda_mandala, i)))

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
                "verses_summary": f"Mandala {i} contains {len(res)} verses."
            }
            for i, res in enumerate(ordered_results, start=1)
        }
    else:
        chapters = {i: res for i, res in enumerate(ordered_results, start=1)}

    response_data = {"book": "rigveda", "chapters": chapters}
    if summary:
        _rigveda_all_summary_cache = response_data
    else:
        _rigveda_all_full_cache = response_data
    return response_data
