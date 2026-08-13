from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter

from services.library_loader import SingleFileBook

YAJURVEDA_DATA_DIR = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "bhavykhatri DharmicData bhavykhatri-AddTransForGita Yajurveda"
)

YAJURVEDA_KANVA_FILE = "vajasneyi_kanva_samhita_chapters.json"
YAJURVEDA_MADHYADINA_FILE = "vajasneyi_madhyadina_samhita.json"


def _normalize_yajurveda_rows(rows: List[Any]) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        chapter_value = row.get("chapter") if row.get("chapter") is not None else row.get("adhyaya")
        if not isinstance(chapter_value, int):
            continue
        normalized.append(
            {
                "chapter": chapter_value,
                "verse": 1,
                "text": row.get("text") or "",
                "type": str(row.get("samhita") or ""),
                "samhita": row.get("samhita") or "",
                "translations": {},
            }
        )
    return normalized


def _filter_yajurveda_chapter(rows: list, chapter_number: int) -> list:
    results: list = []
    for row in rows:
        if row.get("chapter") == chapter_number:
            results.append({**row, "verse": len(results) + 1})
    return results


def _group_yajurveda_chapters(rows: list) -> Dict[int, list]:
    chapters: Dict[int, list] = {}
    for row in rows:
        ch = row.get("chapter")
        if isinstance(ch, int):
            chapters.setdefault(ch, []).append(row)
    for ch in chapters:
        for idx, v in enumerate(chapters[ch]):
            v["verse"] = idx + 1
    return chapters


_loader = SingleFileBook(
    book="yajurveda",
    book_title="Yajurveda",
    chapter_label="Chapter",
    data_files=[
        YAJURVEDA_DATA_DIR / YAJURVEDA_KANVA_FILE,
        YAJURVEDA_DATA_DIR / YAJURVEDA_MADHYADINA_FILE,
    ],
    normalize_rows=_normalize_yajurveda_rows,
    filter_chapter=_filter_yajurveda_chapter,
    group_chapters=_group_yajurveda_chapters,
)

router = _loader.build_router(prefix="/library/yajurveda", tags=["Yajurveda"])
