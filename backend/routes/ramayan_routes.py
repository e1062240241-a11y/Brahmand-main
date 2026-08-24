from pathlib import Path
from typing import Any, Dict, List


from services.library_loader import ChapterFileBook

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


def _normalize_ramayan_kaanda(rows: List[Any], kaanda_number: int) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for row in rows:
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
    return normalized


_loader = ChapterFileBook(
    book="ramayan",
    book_title="Ramayan",
    chapter_label="Kaanda",
    data_dir=RAMAYAN_DATA_DIR,
    chapter_count=7,
    chapter_file=lambda n: RAMAYAN_DATA_DIR / RAMAYAN_KAANDA_FILES[n],
    normalize=_normalize_ramayan_kaanda,
)

router = _loader.build_router(prefix="/library/ramayan", tags=["Ramayan"])
