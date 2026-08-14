from pathlib import Path

from fastapi import APIRouter

from services.library_loader import SingleFileBook

UPANISHADS_DATA_FILE = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "upanishads_data.json"
)

_loader = SingleFileBook(
    book="upanishads",
    book_title="Upanishads",
    chapter_label="Chapter",
    data_files=[UPANISHADS_DATA_FILE],
)

router = _loader.build_router(prefix="/library/upanishads", tags=["Upanishads"])
