from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter

from services.library_loader import ChapterFileBook

RAMCHARITMANAS_DATA_DIR = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "bhavykhatri DharmicData bhavykhatri-AddTransForGita Ramcharitmanas"
)

KAND_FILE_PREFIXES: Dict[int, str] = {
    1: "1_बाल_काण्ड_data",
    2: "2_अयोध्या_काण्ड_data",
    3: "3_अरण्य_काण्ड_data",
    4: "4_किष्किन्धा_काण्ड_data",
    5: "5_सुंदर_काण्ड_data",
    6: "6_लंका_काण्ड_data",
    7: "7_उत्तर_काण्ड_data",
}


def _normalize_ramcharitmanas_kand(rows: List[Any], kand_number: int) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for i, row in enumerate(rows):
        if not isinstance(row, dict):
            continue
        normalized.append(
            {
                "chapter": kand_number,
                "verse": i + 1,
                "text": row.get("content") or "",
                "type": row.get("type") or "",
                "kaand": row.get("kaand") or "",
                "translations": {},
            }
        )
    return normalized


_loader = ChapterFileBook(
    book="ramcharitmanas",
    book_title="Ramcharitmanas",
    chapter_label="Kand",
    data_dir=RAMCHARITMANAS_DATA_DIR,
    chapter_count=7,
    chapter_file=lambda n: RAMCHARITMANAS_DATA_DIR / f"{KAND_FILE_PREFIXES[n]}.json",
    normalize=_normalize_ramcharitmanas_kand,
)

router = _loader.build_router(prefix="/library/ramcharitmanas", tags=["Ramcharitmanas"])
