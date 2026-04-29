import json
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/library/mahabharata", tags=["Mahabharata"])

MAHABHARATA_DATA_DIR = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "bhavykhatri DharmicData bhavykhatri-AddTransForGita Mahabharata"
)

_mahabharata_book_cache: Dict[int, List[Dict[str, Any]]] = {}


def _load_mahabharata_book(book_number: int) -> List[Dict[str, Any]]:
    if book_number in _mahabharata_book_cache:
        return _mahabharata_book_cache[book_number]

    if book_number < 1 or book_number > 18:
        raise HTTPException(status_code=404, detail="Invalid Mahabharata book number")

    book_path = MAHABHARATA_DATA_DIR / f"mahabharata_book_{book_number}.json"
    if not book_path.exists():
        raise HTTPException(status_code=404, detail="Mahabharata book file not found")

    try:
        with book_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to load Mahabharata book")

    if not isinstance(payload, list):
        raise HTTPException(status_code=500, detail="Invalid Mahabharata book format")

    normalized: List[Dict[str, Any]] = []
    for row in payload:
        if not isinstance(row, dict):
            continue
        verse_number = row.get("shloka")
        if not isinstance(verse_number, int):
            verse_number = len(normalized) + 1
        normalized.append(
            {
                "chapter": book_number,
                "verse": verse_number,
                "text": row.get("text") or "",
                "type": "",
                "book": row.get("book"),
                "chapter_number": row.get("chapter"),
                "translations": {},
            }
        )

    _mahabharata_book_cache[book_number] = normalized
    return normalized


@router.get("/book/{book_number}")
async def get_mahabharata_book(book_number: int):
    verses = _load_mahabharata_book(book_number)
    return {
        "book": "mahabharata",
        "chapter": book_number,
        "total_verses": len(verses),
        "verses": verses,
    }
