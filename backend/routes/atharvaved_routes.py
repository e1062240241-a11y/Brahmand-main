from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter

from services.library_loader import ChapterFileBook

ATHARVA_VEDA_DATA_DIR = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "bhavykhatri DharmicData bhavykhatri-AddTransForGita AtharvaVeda"
)


def _normalize_atharvaved_kaanda(rows: List[Any], kaanda_number: int) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for row in rows:
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
    return normalized


_loader = ChapterFileBook(
    book="atharvaved",
    book_title="Atharvaved",
    chapter_label="Kaanda",
    data_dir=ATHARVA_VEDA_DATA_DIR,
    chapter_count=20,
    chapter_file=lambda n: ATHARVA_VEDA_DATA_DIR / f"atharvaveda_kaanda_{n}.json",
    normalize=_normalize_atharvaved_kaanda,
)

router = _loader.build_router(prefix="/library/atharvaved", tags=["Atharvaved"])
