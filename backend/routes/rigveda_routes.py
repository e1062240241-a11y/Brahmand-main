from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter

from services.library_loader import ChapterFileBook

RIGVEDA_DATA_DIR = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "bhavykhatri DharmicData bhavykhatri-AddTransForGita Rigveda"
)


def _normalize_rigveda_mandala(rows: List[Any], mandala_number: int) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for row in rows:
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
    return normalized


_loader = ChapterFileBook(
    book="rigveda",
    book_title="Rigveda",
    chapter_label="Mandala",
    data_dir=RIGVEDA_DATA_DIR,
    chapter_count=10,
    chapter_file=lambda n: RIGVEDA_DATA_DIR / f"rigveda_mandala_{n}.json",
    normalize=_normalize_rigveda_mandala,
)

router = _loader.build_router(prefix="/library/rigveda", tags=["Rigveda"])
