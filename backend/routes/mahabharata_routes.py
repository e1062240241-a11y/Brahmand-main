from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter

from services.library_loader import ChapterFileBook

MAHABHARATA_DATA_DIR = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "bhavykhatri DharmicData bhavykhatri-AddTransForGita Mahabharata"
)


def _normalize_mahabharata_book(rows: List[Any], book_number: int) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for row in rows:
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
    return normalized


_loader = ChapterFileBook(
    book="mahabharata",
    book_title="Mahabharata",
    chapter_label="Book",
    data_dir=MAHABHARATA_DATA_DIR,
    chapter_count=18,
    chapter_file=lambda n: MAHABHARATA_DATA_DIR / f"mahabharata_book_{n}.json",
    normalize=_normalize_mahabharata_book,
)

router = _loader.build_router(
    prefix="/library/mahabharata",
    tags=["Mahabharata"],
    chapter_path="/book/{chapter_number}",
)
