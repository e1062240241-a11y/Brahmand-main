from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional, Dict, Any
from database import get_sql_db
from schemas.temple_schemas import TempleListItemResponse, TempleDetailResponse, CoordsSchema

router = APIRouter(prefix="/api/v1/temples", tags=["Temples V1"])

def build_location_label(row: Dict[str, Any]) -> str:
    parts = [row.get("location_area"), row.get("location_city"), row.get("location_state")]
    valid_parts = [p for p in parts if p]
    if valid_parts:
        return ", ".join(valid_parts)
    return row.get("name", "")

@router.get("", response_model=List[TempleListItemResponse])
def list_temples(db: Session = Depends(get_sql_db)):
    """List all active temples"""
    sql = text("SELECT * FROM temples WHERE is_active = 1")
    rows = db.execute(sql).mappings().all()
    
    res = []
    for r in rows:
        item = dict(r)
        item["location_label"] = build_location_label(item)
        if item.get("latitude") is not None and item.get("longitude") is not None:
            item["coords"] = {"latitude": item["latitude"], "longitude": item["longitude"]}
        else:
            item["coords"] = None
        res.append(item)
    return res

@router.get("/search", response_model=List[TempleListItemResponse])
def search_temples(q: str = Query(..., min_length=1), db: Session = Depends(get_sql_db)):
    """Search active temples by query term against name, deity, location, or summary"""
    escaped_q = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    pattern = f"%{escaped_q}%"
    # FIXED: alias -> alias_text
    sql = text("""
        SELECT DISTINCT t.* FROM temples t
        LEFT JOIN temple_aliases a ON t.id = a.temple_id
        WHERE t.is_active = 1 AND (
            t.name LIKE :q ESCAPE '\\' OR
            t.deity LIKE :q ESCAPE '\\' OR
            t.location_area LIKE :q ESCAPE '\\' OR
            t.location_city LIKE :q ESCAPE '\\' OR
            t.location_state LIKE :q ESCAPE '\\' OR
            t.short_summary LIKE :q ESCAPE '\\' OR
            a.alias_text LIKE :q ESCAPE '\\'
        )
    """)
    rows = db.execute(sql, {"q": pattern}).mappings().all()
    
    res = []
    for r in rows:
        item = dict(r)
        item["location_label"] = build_location_label(item)
        if item.get("latitude") is not None and item.get("longitude") is not None:
            item["coords"] = {"latitude": item["latitude"], "longitude": item["longitude"]}
        else:
            item["coords"] = None
        res.append(item)
    return res

@router.get("/{slug_or_id}", response_model=TempleDetailResponse)
def get_temple_by_slug_or_id(slug_or_id: str, db: Session = Depends(get_sql_db)):
    """Get complete temple details including sessions, links, darshan, facilities, guidelines, metadata, and media"""
    # 1. Fetch temple core row (with fallback alias & prefix resolution)
    sql_temple = text("SELECT * FROM temples WHERE (slug = :id OR id = :id) AND is_active = 1")
    temple_row = db.execute(sql_temple, {"id": slug_or_id}).mappings().first()
    
    # Fallback 1: Check temple_aliases table
    if not temple_row:
        sql_alias = text("""
            SELECT t.* FROM temples t 
            JOIN temple_aliases a ON t.id = a.temple_id 
            WHERE a.alias_text = :id AND t.is_active = 1 AND a.is_active = 1
        """)
        temple_row = db.execute(sql_alias, {"id": slug_or_id}).mappings().first()

    # Fallback 2: Try stripping common category prefixes
    if not temple_row:
        prefixes = ["jyotirling-", "shaktipeeth-", "shakti-peeth-", "char-dham-", "shiva-", "divya-desam-"]
        for prefix in prefixes:
            if slug_or_id.startswith(prefix):
                stripped_id = slug_or_id[len(prefix):]
                temple_row = db.execute(sql_temple, {"id": stripped_id}).mappings().first()
                if temple_row:
                    break

    # Fallback 3: Substring match on slug or id
    if not temple_row:
        escaped_slug = slug_or_id.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        sql_like = text("SELECT * FROM temples WHERE (slug LIKE :pattern ESCAPE '\\' OR id LIKE :pattern ESCAPE '\\') AND is_active = 1")
        temple_row = db.execute(sql_like, {"pattern": f"%{escaped_slug}%"}).mappings().first()

    if not temple_row:
        raise HTTPException(status_code=404, detail=f"Temple '{slug_or_id}' not found")
    
    temple_dict = dict(temple_row)
    temple_id = temple_dict["id"]
    temple_dict["location_label"] = build_location_label(temple_dict)
    
    if temple_dict.get("latitude") is not None and temple_dict.get("longitude") is not None:
        temple_dict["coords"] = {"latitude": temple_dict["latitude"], "longitude": temple_dict["longitude"]}
    else:
        temple_dict["coords"] = None

    # 2. Aarti sessions (Returns title, time, time_start, time_end, session_type for frontend mapper)
    sql_aarti = text("""
        SELECT title, time_start, time_end, session_type 
        FROM temple_aarti_sessions 
        WHERE temple_id = :tid AND is_active = 1 
        ORDER BY sort_order ASC
    """)
    aarti_rows = db.execute(sql_aarti, {"tid": temple_id}).mappings().all()
    aarti_list = []
    for a in aarti_rows:
        ad = dict(a)
        if ad.get("time_start") and ad.get("time_end"):
            ad["time"] = f"{ad['time_start']} – {ad['time_end']}"
        else:
            ad["time"] = ad.get("time_start") or ad.get("time_end") or ""
        aarti_list.append(ad)
    temple_dict["aarti_sessions"] = aarti_list

    # 3. Official links (FIXED: Returns arrays of websites and helplines)
    sql_links = text("SELECT link_type, value FROM temple_official_links WHERE temple_id = :tid AND is_verified = 1")
    link_rows = db.execute(sql_links, {"tid": temple_id}).mappings().all()
    official_links = {"websites": [], "helplines": []}
    for l in link_rows:
        if l["link_type"] == "website":
            official_links["websites"].append(l["value"])
        elif l["link_type"] == "helpline":
            official_links["helplines"].append(l["value"])
    temple_dict["official_links"] = official_links

    # 4. Darshan details
    sql_darshan = text("SELECT opening_time, closing_time, general_darshan, vip_darshan, seasonal_notes FROM temple_darshan_details WHERE temple_id = :tid")
    darshan_row = db.execute(sql_darshan, {"tid": temple_id}).mappings().first()
    temple_dict["darshan_details"] = dict(darshan_row) if darshan_row else None

    # 5. Facilities
    sql_facilities = text("SELECT facility_key FROM temple_facilities WHERE temple_id = :tid AND is_active = 1 ORDER BY sort_order ASC")
    fac_rows = db.execute(sql_facilities, {"tid": temple_id}).mappings().all()
    temple_dict["facilities"] = [f["facility_key"] for f in fac_rows]

    # 6. Visitor guidelines with points
    sql_guidelines = text("SELECT id, icon, title FROM temple_visitor_guidelines WHERE temple_id = :tid AND is_active = 1 ORDER BY sort_order ASC")
    g_rows = db.execute(sql_guidelines, {"tid": temple_id}).mappings().all()
    
    guidelines_list = []
    for g in g_rows:
        g_id = g["id"]
        sql_pts = text("SELECT point_text FROM temple_guideline_points WHERE guideline_id = :gid ORDER BY sort_order ASC")
        pt_rows = db.execute(sql_pts, {"gid": g_id}).mappings().all()
        guidelines_list.append({
            "icon": g["icon"],
            "title": g["title"],
            "points": [p["point_text"] for p in pt_rows]
        })
    temple_dict["visitor_guidelines"] = guidelines_list

    # 7. Metadata (FIXED: Added missing fields + joined festivals!)
    sql_meta = text("""
        SELECT about, mythological_significance, history, architecture, sacred_rituals, pilgrimage_circuit 
        FROM temple_metadata 
        WHERE temple_id = :tid AND language_code = 'en'
    """)
    meta_row = db.execute(sql_meta, {"tid": temple_id}).mappings().first()
    
    # Fetch festivals to append to metadata
    sql_festivals = text("SELECT name FROM temple_festivals WHERE temple_id = :tid AND language_code = 'en' AND is_active = 1 ORDER BY sort_order ASC")
    fest_rows = db.execute(sql_festivals, {"tid": temple_id}).mappings().all()
    
    if meta_row:
        meta_dict = dict(meta_row)
        meta_dict["festivals"] = [f["name"] for f in fest_rows]
        temple_dict["metadata"] = meta_dict
    else:
        temple_dict["metadata"] = None

    # 8. Media (FIXED: caption -> title/description)
    sql_media = text("SELECT id, media_type, url, thumbnail_url, title, description, sort_order FROM temple_media WHERE temple_id = :tid AND is_active = 1 ORDER BY sort_order ASC")
    media_rows = db.execute(sql_media, {"tid": temple_id}).mappings().all()
    temple_dict["media"] = [dict(m) for m in media_rows]

    return temple_dict