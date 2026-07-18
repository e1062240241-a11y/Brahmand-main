import json
import asyncio
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/library/ramayan", tags=["Ramayan"])

RAMAYAN_DATA_DIR = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "bhavykhatri DharmicData bhavykhatri-AddTransForGita ValmikiRamayana"
)

RAMAYAN_KAANDA_FILES: Dict[int, str] = {
    1: "1_balakanda.json",
    2: "2_ayodhyakanda.json",
    3: "3_aranyakanda.json",
    4: "4_kishkindhakanda.json",
    5: "5_sundarakanda.json",
    6: "6_yudhhakanda.json",
    7: "7_uttarakanda.json",
}

_ramayan_kaanda_cache: Dict[int, List[Dict[str, Any]]] = {}
_ramayan_all_summary_cache = None
_ramayan_all_full_cache = None


def _load_ramayan_kaanda(kaanda_number: int) -> List[Dict[str, Any]]:
    if kaanda_number in _ramayan_kaanda_cache:
        return _ramayan_kaanda_cache[kaanda_number]

    if kaanda_number not in RAMAYAN_KAANDA_FILES:
        raise HTTPException(status_code=404, detail="Invalid Ramayan kaanda number")

    kaanda_path = RAMAYAN_DATA_DIR / RAMAYAN_KAANDA_FILES[kaanda_number]
    if not kaanda_path.exists():
        raise HTTPException(status_code=404, detail="Ramayan kaanda file not found")

    try:
        with kaanda_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to load Ramayan kaanda")

    if not isinstance(payload, list):
        raise HTTPException(status_code=500, detail="Invalid Ramayan kaanda format")

    normalized: List[Dict[str, Any]] = []
    for row in payload:
        if not isinstance(row, dict):
            continue
        verse_number = row.get("shloka")
        if not isinstance(verse_number, int):
            verse_number = len(normalized) + 1
        normalized.append(
            {
                "chapter": kaanda_number,
                "verse": verse_number,
                "text": row.get("text") or "",
                "type": "",
                "kaand": row.get("kaanda") or "",
                "sarg": row.get("sarg"),
                "translations": {},
            }
        )

    _ramayan_kaanda_cache[kaanda_number] = normalized
    return normalized


@router.get("/chapter/{kaanda_number}")
async def get_ramayan_kaanda(kaanda_number: int):
    verses = await asyncio.to_thread(_load_ramayan_kaanda, kaanda_number)
    return {
        "book": "ramayan",
        "chapter": kaanda_number,
        "total_verses": len(verses),
        "verses": verses,
    }


@router.get("/all")
async def get_ramayan_all(summary: bool = True):
    global _ramayan_all_summary_cache, _ramayan_all_full_cache
    if summary and _ramayan_all_summary_cache is not None:
        return _ramayan_all_summary_cache
    if not summary and _ramayan_all_full_cache is not None:
        return _ramayan_all_full_cache

    results = await asyncio.gather(*(
        asyncio.to_thread(_load_ramayan_kaanda, i) for i in range(1, 8)
    ))
    if summary:
        chapters = {
            i: {
                "chapter": i,
                "total_verses": len(res),
                "verses_summary": f"Kaanda {i} contains {len(res)} verses."
            }
            for i, res in enumerate(results, start=1)
        }
    else:
        chapters = {i: res for i, res in enumerate(results, start=1)}
        
    response_data = {"book": "ramayan", "chapters": chapters}
    if summary:
        _ramayan_all_summary_cache = response_data
    else:
        _ramayan_all_full_cache = response_data
    return response_data
