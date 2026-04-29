import json
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
    verses = _load_ramayan_kaanda(kaanda_number)
    return {
        "book": "ramayan",
        "chapter": kaanda_number,
        "total_verses": len(verses),
        "verses": verses,
    }
