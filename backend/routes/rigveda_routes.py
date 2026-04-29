import json
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
    verses = _load_rigveda_mandala(mandala_number)
    return {
        "book": "rigveda",
        "chapter": mandala_number,
        "total_verses": len(verses),
        "verses": verses,
    }
