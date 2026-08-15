from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class AartiSessionSchema(BaseModel):
    title: str
    time: Optional[str] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    session_type: Optional[str] = None

class CoordsSchema(BaseModel):
    latitude: float
    longitude: float

class TempleOfficialLinksSchema(BaseModel):
    website: Optional[str] = None
    helpline: Optional[str] = None

class TempleDarshanDetailsSchema(BaseModel):
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    general_darshan: Optional[str] = None
    vip_darshan: Optional[str] = None

class TempleGuidelineSchema(BaseModel):
    icon: str
    title: str
    points: List[str]

class TempleMetadataSchema(BaseModel):
    about: Optional[str] = None
    history: Optional[str] = None
    architecture: Optional[str] = None

class TempleListItemResponse(BaseModel):
    id: str
    slug: str
    name: str
    deity: Optional[str] = None
    category: str
    established_year: Optional[str] = None
    entry_fee: Optional[str] = None
    best_time_to_visit: Optional[str] = None
    short_summary: Optional[str] = None
    description: Optional[str] = None
    location_area: Optional[str] = None
    location_city: Optional[str] = None
    location_state: Optional[str] = None
    location_country: str
    location_label: Optional[str] = None
    coords: Optional[CoordsSchema] = None
    is_verified: bool
    is_active: bool

    class Config:
        from_attributes = True

class TempleDetailResponse(TempleListItemResponse):
    guidance: Optional[str] = None
    contact: Optional[str] = None
    aarti_sessions: List[AartiSessionSchema] = []
    official_links: Optional[TempleOfficialLinksSchema] = None
    darshan_details: Optional[TempleDarshanDetailsSchema] = None
    facilities: List[str] = []
    visitor_guidelines: List[TempleGuidelineSchema] = []
    metadata: Optional[TempleMetadataSchema] = None
    media: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True
