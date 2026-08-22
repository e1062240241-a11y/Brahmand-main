"""
SQLite Database Initializer and Seeder for Brahmand
Creates all required tables for routers/temples.py and seeds from TEMPLE_SEED_DATA.
"""

import sqlite3
import os
import uuid
import re
import logging

logger = logging.getLogger("brahmand_db_init")

DB_PATH = os.path.join(os.path.dirname(__file__), "brahmand.db")

CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS temples (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE,
    name TEXT NOT NULL,
    deity TEXT,
    category TEXT,
    description TEXT,
    guidance TEXT,
    short_summary TEXT,
    location_area TEXT,
    location_city TEXT,
    location_state TEXT,
    location_country TEXT DEFAULT 'India',
    latitude REAL,
    longitude REAL,
    contact TEXT,
    youtube_url TEXT,
    is_verified INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS temple_aliases (
    id TEXT PRIMARY KEY,
    temple_id TEXT NOT NULL,
    alias_text TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY(temple_id) REFERENCES temples(id)
);

CREATE TABLE IF NOT EXISTS temple_aarti_sessions (
    id TEXT PRIMARY KEY,
    temple_id TEXT NOT NULL,
    title TEXT NOT NULL,
    time_start TEXT,
    time_end TEXT,
    session_type TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY(temple_id) REFERENCES temples(id)
);

CREATE TABLE IF NOT EXISTS temple_official_links (
    id TEXT PRIMARY KEY,
    temple_id TEXT NOT NULL,
    link_type TEXT NOT NULL,
    value TEXT NOT NULL,
    is_verified INTEGER DEFAULT 1,
    FOREIGN KEY(temple_id) REFERENCES temples(id)
);

CREATE TABLE IF NOT EXISTS temple_darshan_details (
    id TEXT PRIMARY KEY,
    temple_id TEXT NOT NULL,
    opening_time TEXT,
    closing_time TEXT,
    general_darshan TEXT,
    vip_darshan TEXT,
    seasonal_notes TEXT,
    FOREIGN KEY(temple_id) REFERENCES temples(id)
);

CREATE TABLE IF NOT EXISTS temple_facilities (
    id TEXT PRIMARY KEY,
    temple_id TEXT NOT NULL,
    facility_key TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY(temple_id) REFERENCES temples(id)
);

CREATE TABLE IF NOT EXISTS temple_visitor_guidelines (
    id TEXT PRIMARY KEY,
    temple_id TEXT NOT NULL,
    language_code TEXT DEFAULT 'en',
    icon TEXT,
    title TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY(temple_id) REFERENCES temples(id)
);

CREATE TABLE IF NOT EXISTS temple_guideline_points (
    id TEXT PRIMARY KEY,
    guideline_id TEXT NOT NULL,
    point_text TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY(guideline_id) REFERENCES temple_visitor_guidelines(id)
);

CREATE TABLE IF NOT EXISTS temple_metadata (
    id TEXT PRIMARY KEY,
    temple_id TEXT NOT NULL,
    language_code TEXT DEFAULT 'en',
    about TEXT,
    mythological_significance TEXT,
    history TEXT,
    architecture TEXT,
    sacred_rituals TEXT,
    pilgrimage_circuit TEXT,
    FOREIGN KEY(temple_id) REFERENCES temples(id)
);

CREATE TABLE IF NOT EXISTS temple_festivals (
    id TEXT PRIMARY KEY,
    temple_id TEXT NOT NULL,
    language_code TEXT DEFAULT 'en',
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY(temple_id) REFERENCES temples(id)
);

CREATE TABLE IF NOT EXISTS temple_media (
    id TEXT PRIMARY KEY,
    temple_id TEXT NOT NULL,
    media_type TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY(temple_id) REFERENCES temples(id)
);
"""


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')


def init_and_seed_sqlite():
    """Create tables if missing and seed temple data if table is empty"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Create all tables
        cursor.executescript(CREATE_TABLES_SQL)
        conn.commit()

        # Check if temples table already has data
        cursor.execute("SELECT COUNT(*) FROM temples")
        count = cursor.fetchone()[0]

        if count == 0:
            from data.temple_seed_data import TEMPLE_SEED_DATA

            for t in TEMPLE_SEED_DATA:
                tid = t.get("temple_id") or str(uuid.uuid4())
                name = t.get("name", "")
                slug = tid
                deity = t.get("deity", "")
                category = t.get("category", "sacred")
                description = t.get("description", "")
                guidance = t.get("guidance", "")
                short_summary = (description[:180] + "...") if len(description) > 180 else description
                
                loc = t.get("location", {})
                city = loc.get("city", "") if isinstance(loc, dict) else ""
                state = loc.get("state", "") if isinstance(loc, dict) else ""
                country = loc.get("country", "India") if isinstance(loc, dict) else "India"

                coords = t.get("coords", {})
                lat = coords.get("latitude") if isinstance(coords, dict) else None
                lng = coords.get("longitude") if isinstance(coords, dict) else None

                contact = t.get("contact", "")
                yt_url = t.get("youtube_url", "")

                cursor.execute("""
                    INSERT OR IGNORE INTO temples (
                        id, slug, name, deity, category, description, guidance, short_summary,
                        location_city, location_state, location_country,
                        latitude, longitude, contact, youtube_url, is_verified, is_active, version
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1)
                """, (
                    tid, slug, name, deity, category, description, guidance, short_summary,
                    city, state, country, lat, lng, contact, yt_url
                ))

                # Insert aliases
                alias_name_slug = slugify(name)
                if alias_name_slug and alias_name_slug != slug:
                    cursor.execute("""
                        INSERT OR IGNORE INTO temple_aliases (id, temple_id, alias_text, is_active)
                        VALUES (?, ?, ?, 1)
                    """, (str(uuid.uuid4()), tid, alias_name_slug))

                # Insert Aarti Sessions
                aartis = t.get("aarti_timings", {})
                if isinstance(aartis, dict):
                    for idx, (a_title, a_time) in enumerate(aartis.items()):
                        cursor.execute("""
                            INSERT OR IGNORE INTO temple_aarti_sessions (
                                id, temple_id, title, time_start, session_type, sort_order, is_active
                            ) VALUES (?, ?, ?, ?, 'aarti', ?, 1)
                        """, (str(uuid.uuid4()), tid, a_title, a_time, idx))

                # Insert Darshan Details
                timings = t.get("timings", {})
                darshan_time = timings.get("Darshan", "") if isinstance(timings, dict) else ""
                cursor.execute("""
                    INSERT OR IGNORE INTO temple_darshan_details (
                        id, temple_id, general_darshan, seasonal_notes
                    ) VALUES (?, ?, ?, ?)
                """, (str(uuid.uuid4()), tid, darshan_time, guidance))

                # Insert Official Links
                if contact:
                    cursor.execute("""
                        INSERT OR IGNORE INTO temple_official_links (
                            id, temple_id, link_type, value, is_verified
                        ) VALUES (?, ?, 'helpline', ?, 1)
                    """, (str(uuid.uuid4()), tid, contact))

                # Insert Metadata
                cursor.execute("""
                    INSERT OR IGNORE INTO temple_metadata (
                        id, temple_id, language_code, about, history, mythological_significance
                    ) VALUES (?, ?, 'en', ?, ?, ?)
                """, (str(uuid.uuid4()), tid, description, description, f"Sacred {category} dedicated to {deity}."))

                # Insert Media
                if yt_url:
                    m_type = "live_stream" if "live_stream" in yt_url else "video"
                    cursor.execute("""
                        INSERT OR IGNORE INTO temple_media (
                            id, temple_id, media_type, url, title, sort_order, is_active
                        ) VALUES (?, ?, ?, ?, 'Live Darshan Stream', 0, 1)
                    """, (str(uuid.uuid4()), tid, m_type, yt_url))

            conn.commit()
            print(f"✅ Successfully seeded SQLite database with {len(TEMPLE_SEED_DATA)} temples.")
    except Exception as e:
        print(f"❌ Error initializing SQLite database: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    init_and_seed_sqlite()
