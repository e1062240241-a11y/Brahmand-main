import json
import asyncio
from pathlib import Path
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/library/ramcharitmanas", tags=["Ramcharitmanas"])

RAMCHARITMANAS_DATA_DIR = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "bhavykhatri DharmicData bhavykhatri-AddTransForGita Ramcharitmanas"
)

# Mapping of Kand number to their file prefix
KAND_FILE_PREFIXES = {
    1: "1_बाल_काण्ड_data",
    2: "2_अयोध्या_काण्ड_data",
    3: "3_अरण्य_काण्ड_data",
    4: "4_किष्किन्धा_काण्ड_data",
    5: "5_सुंदर_काण्ड_data",
    6: "6_लंका_काण्ड_data",
    7: "7_उत्तर_काण्ड_data"
}

_ramcharitmanas_kand_cache: Dict[int, List[Dict[str, Any]]] = {}
_ramcharitmanas_all_summary_cache = None
_ramcharitmanas_all_full_cache = None

def _load_ramcharitmanas_kand(kand_number: int) -> List[Dict[str, Any]]:
    if kand_number in _ramcharitmanas_kand_cache:
        return _ramcharitmanas_kand_cache[kand_number]

    if kand_number not in KAND_FILE_PREFIXES:
        raise HTTPException(status_code=404, detail="Invalid Ramcharitmanas kand number")
        
    file_prefix = KAND_FILE_PREFIXES[kand_number]
    kand_path = RAMCHARITMANAS_DATA_DIR / f"{file_prefix}.json"
    
    if not kand_path.exists():
        raise HTTPException(status_code=404, detail="Ramcharitmanas kand file not found")
        
    try:
        with kand_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to load Ramcharitmanas kand")
        
    if not isinstance(payload, list):
        raise HTTPException(status_code=500, detail="Invalid Ramcharitmanas kand format")
        
    normalized: List[Dict[str, Any]] = []
    
    # We want to format similar to Gita so the frontend can reuse the component easily, 
    # or just retain its structure for a slightly modified component.
    # The Gita reader uses: chapter, verse, text, translations.
    # We will map: 
    # chapter -> kand
    # verse -> index in list
    # text -> content
    # type -> type (e.g., श्लोक, दोहा/सोरठा, चौपाई)
    
    for i, row in enumerate(payload):
        if not isinstance(row, dict):
            continue
        normalized.append(
            {
                "chapter": kand_number,
                "verse": i + 1,  # 1-indexed for layout compatibility
                "text": row.get("content") or "",
                "type": row.get("type") or "",
                "kaand": row.get("kaand") or "",
                "translations": {} # No translations format by default
            }
        )

    _ramcharitmanas_kand_cache[kand_number] = normalized
    return normalized

@router.get("/chapter/{kand_number}")
async def get_ramcharitmanas_kand(kand_number: int):
    if kand_number in _ramcharitmanas_kand_cache:
        verses = _ramcharitmanas_kand_cache[kand_number]
    else:
        verses = await asyncio.to_thread(_load_ramcharitmanas_kand, kand_number)
    return {
        "book": "ramcharitmanas",
        "chapter": kand_number,
        "total_verses": len(verses),
        "verses": verses,
    }


@router.get("/all")
async def get_ramcharitmanas_all(summary: bool = True):
    global _ramcharitmanas_all_summary_cache, _ramcharitmanas_all_full_cache
    if summary and _ramcharitmanas_all_summary_cache is not None:
        return _ramcharitmanas_all_summary_cache
    if not summary and _ramcharitmanas_all_full_cache is not None:
        return _ramcharitmanas_all_full_cache

    results = []
    tasks = []
    for i in range(1, 8):
        if i in _ramcharitmanas_kand_cache:
            results.append((i, _ramcharitmanas_kand_cache[i]))
        else:
            tasks.append((i, asyncio.to_thread(_load_ramcharitmanas_kand, i)))
            
    if tasks:
        indices, awaitables = zip(*tasks)
        loaded = await asyncio.gather(*awaitables)
        for idx, res in zip(indices, loaded):
            results.append((idx, res))
            
    results.sort(key=lambda x: x[0])
    ordered_results = [res for idx, res in results]

    if summary:
        chapters = {
            i: {
                "chapter": i,
                "total_verses": len(res),
                "verses_summary": f"Kand {i} contains {len(res)} verses."
            }
            for i, res in enumerate(ordered_results, start=1)
        }
    else:
        chapters = {i: res for i, res in enumerate(ordered_results, start=1)}
        
    response_data = {"book": "ramcharitmanas", "chapters": chapters}
    if summary:
        _ramcharitmanas_all_summary_cache = response_data
    else:
        _ramcharitmanas_all_full_cache = response_data
    return response_data
