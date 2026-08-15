"""
Seed Script: Seed Temple Data & Rules into PostgreSQL Database
Migrates frontend rules and static fallback metadata into PostgreSQL using SQLAlchemy 2.0 ORM.
"""
import sys
import os
import uuid
import re
from datetime import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models.temple_orm import (
    Base, Temple, TempleMetadata, TempleAlias, TempleOfficialLink,
    TempleDarshanDetails, TempleFacility, TempleVisitorGuideline,
    TempleGuidelinePoint, TempleFestival, TempleAartiSession,
    TempleTransport, TempleMedia, TempleCoords, TempleCategory,
    AliasType, MatchMode, OfficialLinkType, FacilityKey, SessionType
)

# Seed Data structures representing migrated content from frontend rules
SEED_TEMPLES_DATA = [
    {
        "slug": "jyotirling-somnath-temple-gujarat",
        "name": "Somnath Jyotirlinga Temple",
        "deity": "Lord Shiva",
        "category": TempleCategory.JYOTIRLINGA,
        "established_year": "Rebuilt 1951",
        "entry_fee": "Free Entry",
        "best_time_to_visit": "October to March",
        "short_summary": "The first among the 12 sacred Jyotirlinga shrines of Lord Shiva.",
        "description": "Somnath Temple located in Prabhas Patan near Veraval in Saurashtra on the western coast of Gujarat is believed to be the first among the twelve Jyotirlinga shrines of Shiva.",
        "guidance": "Dress modestly. Traditional attire preferred. Electronic items and leather goods prohibited.",
        "latitude": 20.8880,
        "longitude": 70.4012,
        "location_area": "Prabhas Patan",
        "location_city": "Veraval",
        "location_state": "Gujarat",
        "location_country": "India",
        "contact": "+91-2876-231200",
        "is_verified": True,
        "metadata": {
            "en": {
                "about": "Somnath is known as 'The Shrine Eternal' having survived many destruction and reconstruction cycles.",
                "mythological_significance": "Moon God Chandra worshipped Lord Shiva here to break his curse given by King Daksha.",
                "history": "Rebuilt multiple times throughout centuries, latest reconstruction initiated by Sardar Vallabhbhai Patel in 1951.",
                "architecture": "Built in Chalukya style of temple architecture (Kailash Mahameru Prasad style).",
                "sacred_rituals": "Dhwaja Arohan, Somnath Mahadev Abhishek, Sandhya Aarti.",
                "pilgrimage_circuit": "Saurashtra Jyotirlinga Circuit"
            },
            "hi": {
                "about": "सोमनाथ को 'शाश्वत तीर्थ' कहा जाता है जो कई विनाशों के बाद भी पुनर्निर्मित हुआ।",
                "mythological_significance": "चंद्र देव ने दक्ष प्रजापति के श्राप से मुक्ति के लिए यहाँ भगवान शिव की तपस्या की थी।",
                "history": "1951 में सरदार वल्लभभाई पटेल द्वारा इसका आधुनिक जीर्णोद्धार कराया गया।",
                "architecture": "सोमनाथ मंदिर चालुक्य शैली में निर्मित एक उत्कृष्ट स्थापत्य कला है।",
                "sacred_rituals": "ध्वजारोहण, सोमनाथ महादेव अभिषेक, संध्या आरती।",
                "pilgrimage_circuit": "सौराष्ट्र ज्योतिर्लिंग परिपथ"
            }
        },
        "aliases": [
            ("Somnath Temple", AliasType.NAME_ALIAS, MatchMode.INCLUDES, 1),
            ("Somnath Mahadev", AliasType.NAME_ALIAS, MatchMode.INCLUDES, 2),
            ("somnath", AliasType.KEYWORD, MatchMode.INCLUDES, 3),
            ("somnath-jyotirlinga", AliasType.ID_ALIAS, MatchMode.INCLUDES, 4)
        ],
        "links": [
            (OfficialLinkType.WEBSITE, "https://www.somnath.org", True),
            (OfficialLinkType.HELPLINE, "+91-2876-231200", True),
            (OfficialLinkType.BOOKING_PORTAL, "https://booking.somnath.org", True)
        ],
        "darshan": {
            "opening_time": "6:00 AM",
            "closing_time": "10:00 PM",
            "general_darshan": "6:00 AM to 9:30 PM",
            "vip_darshan": "Online token booking available",
            "seasonal_notes": "Open year round; special arrangements during Mahashivratri."
        },
        "facilities": [
            FacilityKey.PARKING, FacilityKey.LOCKER, FacilityKey.PRASAD,
            FacilityKey.DRINKING_WATER, FacilityKey.RESTROOMS, FacilityKey.WHEELCHAIR,
            FacilityKey.DHARAMSHALA, FacilityKey.BHOJANALAYA
        ],
        "guidelines": [
            {
                "language_code": "en",
                "icon": "shirt",
                "title": "Dress Code Standards",
                "points": [
                    "Traditional attire preferred (Dhoti/Kurta for men, Saree/Salwar for women).",
                    "Western casuals like shorts or sleeveless shirts are strictly restricted inside sanctum."
                ]
            },
            {
                "language_code": "en",
                "icon": "shield-alert",
                "title": "Prohibited Items",
                "points": [
                    "Mobile phones, cameras, smartwatches, and leather belts/wallets are strictly prohibited.",
                    "Use free locker facility at security check gates before queuing."
                ]
            }
        ],
        "aartis": [
            ("Mangla Aarti", "7:00 AM", "7:30 AM", SessionType.MORNING),
            ("Bhog Aarti", "12:00 PM", "12:30 PM", SessionType.AFTERNOON),
            ("Sandhya Aarti", "7:00 PM", "7:45 PM", SessionType.EVENING)
        ]
    },
    {
        "slug": "jyotirling-mallikarjuna-temple-srisailam",
        "name": "Mallikarjuna Jyotirlinga Temple",
        "deity": "Lord Shiva & Goddess Parvati",
        "category": TempleCategory.JYOTIRLINGA,
        "established_year": "Ancient (2nd Century CE)",
        "entry_fee": "Free General Darshan / Special Entry Pass Rs. 200",
        "best_time_to_visit": "October to February",
        "short_summary": "One of the rare temples serving both as a Jyotirlinga and a Shakti Peeth.",
        "description": "Mallikarjuna Temple located on Srisailam hills in Andhra Pradesh is dedicated to Lord Shiva (Mallikarjuna) and Goddess Parvati (Bhramaramba).",
        "guidance": "Physical queuing required for Sparsha Darshan. Strict traditional dress code enforced.",
        "latitude": 16.0744,
        "longitude": 78.8687,
        "location_area": "Srisailam Hills",
        "location_city": "Srisailam",
        "location_state": "Andhra Pradesh",
        "location_country": "India",
        "contact": "+91-8524-288888",
        "is_verified": True,
        "aliases": [
            ("Mallikarjuna Temple", AliasType.NAME_ALIAS, MatchMode.INCLUDES, 1),
            ("Srisailam Temple", AliasType.NAME_ALIAS, MatchMode.INCLUDES, 2),
            ("srisailam", AliasType.KEYWORD, MatchMode.INCLUDES, 3)
        ],
        "links": [
            (OfficialLinkType.WEBSITE, "https://www.srisailamonline.com", True),
            (OfficialLinkType.HELPLINE, "+91-8524-288888", True)
        ],
        "facilities": [
            FacilityKey.PARKING, FacilityKey.LOCKER, FacilityKey.PRASAD,
            FacilityKey.DRINKING_WATER, FacilityKey.RESTROOMS, FacilityKey.DHARAMSHALA
        ]
    },
    {
        "slug": "jyotirling-mahakaleshwar-temple-ujjain",
        "name": "Mahakaleshwar Jyotirlinga Temple",
        "deity": "Lord Shiva (Mahakal)",
        "category": TempleCategory.JYOTIRLINGA,
        "established_year": "Ancient",
        "entry_fee": "Free Entry / Bhasma Aarti Registration Required",
        "best_time_to_visit": "October to March",
        "short_summary": "Famous south-facing (Dakshinmukhi) Jyotirlinga renowned for the legendary Bhasma Aarti.",
        "description": "Mahakaleshwar Temple in Ujjain, Madhya Pradesh, is situated on the banks of the holy Shipra River.",
        "guidance": "Bhasma Aarti requires mandatory advance booking. Strict dress code for entering sanctum.",
        "latitude": 23.1827,
        "longitude": 75.7682,
        "location_area": "Mahakal Marg",
        "location_city": "Ujjain",
        "location_state": "Madhya Pradesh",
        "location_country": "India",
        "contact": "+91-734-2550563",
        "is_verified": True,
        "aliases": [
            ("Mahakaleshwar Temple", AliasType.NAME_ALIAS, MatchMode.INCLUDES, 1),
            ("Mahakal Ujjain", AliasType.NAME_ALIAS, MatchMode.INCLUDES, 2),
            ("ujjain-mahakal", AliasType.ID_ALIAS, MatchMode.INCLUDES, 3)
        ],
        "links": [
            (OfficialLinkType.WEBSITE, "https://www.shrimahakaleshwar.com", True),
            (OfficialLinkType.HELPLINE, "+91-734-2550563", True),
            (OfficialLinkType.BOOKING_PORTAL, "https://shrimahakaleshwar.com/bhasma-aarti-booking", True)
        ],
        "facilities": [
            FacilityKey.PARKING, FacilityKey.LOCKER, FacilityKey.PRASAD,
            FacilityKey.DRINKING_WATER, FacilityKey.RESTROOMS, FacilityKey.WHEELCHAIR,
            FacilityKey.MOBILE_DEPOSIT
        ]
    }
]


def seed_database(db_url: str = "sqlite:///./temples_test.db"):
    """Creates database tables and seeds initial migrated temple records."""
    print(f"Connecting to database at: {db_url}")
    engine = create_engine(db_url, echo=False)
    
    # Create all tables
    Base.metadata.create_all(engine)
    
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        count = 0
        for temple_data in SEED_TEMPLES_DATA:
            # Check if temple already exists by slug
            existing = session.query(Temple).filter(Temple.slug == temple_data["slug"]).first()
            if existing:
                print(f"Temple {temple_data['slug']} already exists. Skipping.")
                continue

            temple = Temple(
                slug=temple_data["slug"],
                name=temple_data["name"],
                deity=temple_data["deity"],
                category=temple_data["category"],
                established_year=temple_data.get("established_year"),
                entry_fee=temple_data.get("entry_fee"),
                best_time_to_visit=temple_data.get("best_time_to_visit"),
                short_summary=temple_data.get("short_summary"),
                description=temple_data.get("description"),
                guidance=temple_data.get("guidance"),
                latitude=temple_data.get("latitude"),
                longitude=temple_data.get("longitude"),
                location_area=temple_data.get("location_area"),
                location_city=temple_data.get("location_city"),
                location_state=temple_data.get("location_state"),
                location_country=temple_data.get("location_country", "India"),
                contact=temple_data.get("contact"),
                is_verified=temple_data.get("is_verified", True),
                is_active=True
            )
            session.add(temple)
            session.flush() # Flush to get temple.id

            # Metadata records
            if "metadata" in temple_data:
                for lang_code, meta_dict in temple_data["metadata"].items():
                    meta = TempleMetadata(
                        temple_id=temple.id,
                        language_code=lang_code,
                        about=meta_dict.get("about"),
                        mythological_significance=meta_dict.get("mythological_significance"),
                        history=meta_dict.get("history"),
                        architecture=meta_dict.get("architecture"),
                        sacred_rituals=meta_dict.get("sacred_rituals"),
                        pilgrimage_circuit=meta_dict.get("pilgrimage_circuit")
                    )
                    session.add(meta)

            # Aliases
            if "aliases" in temple_data:
                for alias_text, alias_type, match_mode, priority in temple_data["aliases"]:
                    alias = TempleAlias(
                        temple_id=temple.id,
                        alias_text=alias_text,
                        alias_type=alias_type,
                        match_mode=match_mode,
                        priority=priority,
                        is_active=True
                    )
                    session.add(alias)

            # Links
            if "links" in temple_data:
                for link_type, val, is_ver in temple_data["links"]:
                    link = TempleOfficialLink(
                        temple_id=temple.id,
                        link_type=link_type,
                        value=val,
                        is_verified=is_ver
                    )
                    session.add(link)

            # Darshan
            if "darshan" in temple_data:
                d = temple_data["darshan"]
                darshan = TempleDarshanDetails(
                    temple_id=temple.id,
                    opening_time=d.get("opening_time"),
                    closing_time=d.get("closing_time"),
                    general_darshan=d.get("general_darshan"),
                    vip_darshan=d.get("vip_darshan"),
                    seasonal_notes=d.get("seasonal_notes")
                )
                session.add(darshan)

            # Facilities
            if "facilities" in temple_data:
                for idx, fac_key in enumerate(temple_data["facilities"]):
                    facility = TempleFacility(
                        temple_id=temple.id,
                        facility_key=fac_key,
                        sort_order=idx + 1
                    )
                    session.add(facility)

            # Guidelines & Points
            if "guidelines" in temple_data:
                for idx, g_data in enumerate(temple_data["guidelines"]):
                    guideline = TempleVisitorGuideline(
                        temple_id=temple.id,
                        language_code=g_data.get("language_code", "en"),
                        icon=g_data["icon"],
                        title=g_data["title"],
                        sort_order=idx + 1
                    )
                    session.add(guideline)
                    session.flush()

                    for p_idx, pt_text in enumerate(g_data.get("points", [])):
                        point = TempleGuidelinePoint(
                            guideline_id=guideline.id,
                            point_text=pt_text,
                            sort_order=p_idx + 1
                        )
                        session.add(point)

            # Aarti Sessions
            if "aartis" in temple_data:
                for idx, (title, start, end, stype) in enumerate(temple_data["aartis"]):
                    aarti = TempleAartiSession(
                        temple_id=temple.id,
                        title=title,
                        time_start=start,
                        time_end=end,
                        session_type=stype,
                        sort_order=idx + 1
                    )
                    session.add(aarti)

            count += 1

        session.commit()
        print(f"Successfully seeded {count} temple records into the database.")

    except Exception as e:
        session.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    db_path = os.path.abspath(os.path.dirname(__file__) + "/temples_seed.db")
    seed_database(f"sqlite:///{db_path}")
