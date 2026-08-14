import asyncio
import json
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from fastapi import APIRouter, HTTPException


def _read_json(path: Path, not_found_msg: str, invalid_msg: str) -> Any:
    if not path.exists():
        raise HTTPException(status_code=404, detail=not_found_msg)
    try:
        with path.open("r", encoding="utf-8") as file:
            return json.load(file)
    except Exception:
        raise HTTPException(status_code=500, detail=invalid_msg)


def _ensure_list(rows: Any, invalid_msg: str) -> list:
    if not isinstance(rows, list):
        raise HTTPException(status_code=500, detail=invalid_msg)
    return rows


class ChapterFileBook:
    """Book stored as one JSON file per chapter, loaded lazily and cached in memory."""

    def __init__(
        self,
        *,
        book: str,
        book_title: str,
        chapter_label: str,
        data_dir: Path,
        chapter_count: int,
        chapter_file: Callable[[int], Path],
        normalize: Callable[[list, int], List[Dict[str, Any]]],
        rows_from: Optional[Callable[[Any], list]] = None,
    ) -> None:
        self.book = book
        self.book_title = book_title
        self.chapter_label = chapter_label
        self.data_dir = Path(data_dir)
        self.chapter_count = chapter_count
        self.chapter_file = chapter_file
        self.normalize = normalize
        self.rows_from = rows_from
        self._cache: Dict[int, List[Dict[str, Any]]] = {}
        self._summary_cache: Optional[Dict[str, Any]] = None

    def load_chapter(self, number: int) -> List[Dict[str, Any]]:
        if number in self._cache:
            return self._cache[number]

        if number < 1 or number > self.chapter_count:
            raise HTTPException(
                status_code=404,
                detail=f"Invalid {self.book_title} {self.chapter_label} number",
            )

        invalid_msg = f"Invalid {self.book_title} {self.chapter_label} format"
        payload = _read_json(
            self.chapter_file(number),
            not_found_msg=f"{self.book_title} {self.chapter_label} file not found",
            invalid_msg=invalid_msg,
        )
        rows = payload if self.rows_from is None else self.rows_from(payload)
        rows = _ensure_list(rows, invalid_msg)

        normalized = self.normalize(rows, number)
        self._cache[number] = normalized
        return normalized

    async def get_chapter(self, number: int) -> List[Dict[str, Any]]:
        if number in self._cache:
            return self._cache[number]
        return await asyncio.to_thread(self.load_chapter, number)

    async def get_all(self) -> Dict[str, Any]:
        if self._summary_cache is not None:
            return self._summary_cache

        results: List[tuple] = []
        tasks: List[tuple] = []
        for i in range(1, self.chapter_count + 1):
            if i in self._cache:
                results.append((i, self._cache[i]))
            else:
                tasks.append((i, asyncio.to_thread(self.load_chapter, i)))

        if tasks:
            indices, awaitables = zip(*tasks)
            loaded = await asyncio.gather(*awaitables)
            for idx, res in zip(indices, loaded):
                results.append((idx, res))

        results.sort(key=lambda x: x[0])
        ordered_results = [res for idx, res in results]

        chapters = {
            i: {
                "chapter": i,
                "total_verses": len(res),
                "verses_summary": f"{self.chapter_label} {i} contains {len(res)} verses.",
            }
            for i, res in enumerate(ordered_results, start=1)
        }

        self._summary_cache = {"book": self.book, "chapters": chapters}
        return self._summary_cache

    def build_router(
        self,
        *,
        prefix: str,
        tags: list,
        chapter_path: str = "/chapter/{chapter_number}",
    ) -> APIRouter:
        router = APIRouter(prefix=prefix, tags=tags)
        book = self.book

        @router.get(chapter_path)
        async def get_chapter_endpoint(chapter_number: int):
            verses = await self.get_chapter(chapter_number)
            return {
                "book": book,
                "chapter": chapter_number,
                "total_verses": len(verses),
                "verses": verses,
            }

        @router.get("/all")
        async def get_all_endpoint():
            return await self.get_all()

        return router


class SingleFileBook:
    """Book stored as one (or more) whole-file JSON list(s), filtered by chapter on demand."""

    def __init__(
        self,
        *,
        book: str,
        book_title: str,
        chapter_label: str,
        data_files: List[Path],
        normalize_rows: Optional[Callable[[list], list]] = None,
        filter_chapter: Optional[Callable[[list, int], list]] = None,
        group_chapters: Optional[Callable[[list], Dict[int, list]]] = None,
    ) -> None:
        self.book = book
        self.book_title = book_title
        self.chapter_label = chapter_label
        self.data_files = [Path(f) for f in data_files]
        self.normalize_rows = normalize_rows
        self.filter_chapter = filter_chapter or self._default_filter
        self.group_chapters = group_chapters or self._default_group
        self._all_rows: Optional[list] = None
        self._summary_cache: Optional[Dict[str, Any]] = None

    @staticmethod
    def _default_filter(rows: list, number: int) -> list:
        return [r for r in rows if r.get("chapter") == number]

    @staticmethod
    def _default_group(rows: list) -> Dict[int, list]:
        chapters: Dict[int, list] = {}
        for v in rows:
            ch = v.get("chapter")
            if isinstance(ch, int):
                chapters.setdefault(ch, []).append(v)
        return chapters

    def load_all(self) -> list:
        if self._all_rows is not None:
            return self._all_rows

        invalid_msg = f"Invalid {self.book_title} data format"
        all_rows: list = []
        for path in self.data_files:
            payload = _read_json(
                path,
                not_found_msg=f"{self.book_title} data file not found",
                invalid_msg=invalid_msg,
            )
            all_rows.extend(_ensure_list(payload, invalid_msg))

        self._all_rows = self.normalize_rows(all_rows) if self.normalize_rows else all_rows
        return self._all_rows

    async def get_chapter(self, number: int) -> list:
        if self._all_rows is None:
            all_rows = await asyncio.to_thread(self.load_all)
        else:
            all_rows = self._all_rows

        verses = self.filter_chapter(all_rows, number)
        if not verses:
            raise HTTPException(status_code=404, detail=f"{self.book_title} chapter not found")
        return verses

    async def get_all(self) -> Dict[str, Any]:
        if self._summary_cache is not None:
            return self._summary_cache

        if self._all_rows is None:
            all_rows = await asyncio.to_thread(self.load_all)
        else:
            all_rows = self._all_rows

        chapters = self.group_chapters(all_rows)
        chapters_summary = {
            ch: {
                "chapter": ch,
                "total_verses": len(verses),
                "verses_summary": f"{self.chapter_label} {ch} contains {len(verses)} verses.",
            }
            for ch, verses in chapters.items()
        }

        self._summary_cache = {"book": self.book, "chapters": chapters_summary}
        return self._summary_cache

    def build_router(
        self,
        *,
        prefix: str,
        tags: list,
        chapter_path: str = "/chapter/{chapter_number}",
    ) -> APIRouter:
        router = APIRouter(prefix=prefix, tags=tags)
        book = self.book

        @router.get(chapter_path)
        async def get_chapter_endpoint(chapter_number: int):
            verses = await self.get_chapter(chapter_number)
            return {
                "book": book,
                "chapter": chapter_number,
                "total_verses": len(verses),
                "verses": verses,
            }

        @router.get("/all")
        async def get_all_endpoint():
            return await self.get_all()

        return router
