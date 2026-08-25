from pathlib import Path
from typing import Any, Dict, List


from services.library_loader import ChapterFileBook

BHAGAVAD_GITA_CHAPTER_DATA_DIR = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "bhavykhatri DharmicData bhavykhatri-AddTransForGita SrimadBhagvadGita"
)


def _normalize_bhagavad_gita_chapter(rows: List[Any], chapter_number: int) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        normalized.append(
            {
                "chapter": row.get("chapter"),
                "verse": row.get("verse"),
                "text": row.get("text") or "",
                "translations": row.get("translations") if isinstance(row.get("translations"), dict) else {},
            }
        )
    return normalized


_loader = ChapterFileBook(
    book="bhagavad-gita",
    book_title="Bhagavad Gita",
    chapter_label="Chapter",
    data_dir=BHAGAVAD_GITA_CHAPTER_DATA_DIR,
    chapter_count=18,
    chapter_file=lambda n: BHAGAVAD_GITA_CHAPTER_DATA_DIR / f"bhagavad_gita_chapter_{n}.json",
    rows_from=lambda payload: payload.get("BhagavadGitaChapter"),
    normalize=_normalize_bhagavad_gita_chapter,
)

router = _loader.build_router(prefix="/library/bhagavad-gita", tags=["Bhagavad Gita"])


def _load_bhagavad_gita_chapter(chapter_number: int) -> List[Dict[str, Any]]:
    return _loader.load_chapter(chapter_number)
