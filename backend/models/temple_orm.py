"""
SQLAlchemy 2.0 ORM Schema Models for Temple Metadata System
Compatible with FastAPI & Alembic Migrations
"""
import enum
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey,
    Integer, Numeric, String, Text, UniqueConstraint, func, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# ---------------- ENUMS ----------------

class TempleCategory(str, enum.Enum):
    JYOTIRLINGA = "jyotirlinga"
    SHAKTI_PEETH = "shakti_peeth"
    CHAR_DHAM = "char_dham"
    DIVYA_DESAM = "divya_desam"
    ISKCON = "iskcon"
    SIKH = "sikh"
    SACRED = "sacred"


class AliasType(str, enum.Enum):
    NAME_ALIAS = "name_alias"
    ID_ALIAS = "id_alias"
    KEYWORD = "keyword"


class MatchMode(str, enum.Enum):
    INCLUDES = "includes"
    WORD_BOUNDARY = "word_boundary"


class OfficialLinkType(str, enum.Enum):
    WEBSITE = "website"
    HELPLINE = "helpline"
    EMAIL = "email"
    BOOKING_PORTAL = "booking_portal"


class FacilityKey(str, enum.Enum):
    PARKING = "parking"
    LOCKER = "locker"
    PRASAD = "prasad"
    DRINKING_WATER = "drinking_water"
    RESTROOMS = "restrooms"
    SHOE_STAND = "shoe_stand"
    WHEELCHAIR = "wheelchair"
    DHARAMSHALA = "dharamshala"
    BHOJANALAYA = "bhojanalaya"
    PUJA_BOOKING = "puja_booking"
    MEDICAL_AID = "medical_aid"
    MOBILE_DEPOSIT = "mobile_deposit"
    TRANSPORT_ASSISTANCE = "transport_assistance"
    HAIR_TONSURING = "hair_tonsuring"
    HOLY_KUND = "holy_kund"


class SessionType(str, enum.Enum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"


class TransportType(str, enum.Enum):
    AIR = "air"
    RAIL = "rail"
    BUS = "bus"
    ROAD = "road"


class MediaType(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    LIVE_STREAM = "live_stream"
    GALLERY = "gallery"


class CoordType(str, enum.Enum):
    MAIN = "main"
    GHAT = "ghat"
    ENTRANCE = "entrance"
    PARKING = "parking"


class AuditAction(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    APPROVE = "approve"
    REJECT = "reject"


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# ---------------- ORM MODELS ----------------

class Temple(Base):
    __tablename__ = "temples"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    deity: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    category: Mapped[TempleCategory] = mapped_column(Enum(TempleCategory), default=TempleCategory.SACRED, index=True)
    established_year: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    entry_fee: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    best_time_to_visit: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    short_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    guidance: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    location_area: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    location_city: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    location_state: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    location_country: Mapped[str] = mapped_column(String(255), default="India")
    contact: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), index=True)

    # Relationships
    metadata_records: Mapped[List["TempleMetadata"]] = relationship("TempleMetadata", back_populates="temple", cascade="all, delete-orphan")
    aliases: Mapped[List["TempleAlias"]] = relationship("TempleAlias", back_populates="temple", cascade="all, delete-orphan")
    official_links: Mapped[List["TempleOfficialLink"]] = relationship("TempleOfficialLink", back_populates="temple", cascade="all, delete-orphan")
    darshan_details: Mapped[Optional["TempleDarshanDetails"]] = relationship("TempleDarshanDetails", back_populates="temple", uselist=False, cascade="all, delete-orphan")
    facilities: Mapped[List["TempleFacility"]] = relationship("TempleFacility", back_populates="temple", cascade="all, delete-orphan")
    guidelines: Mapped[List["TempleVisitorGuideline"]] = relationship("TempleVisitorGuideline", back_populates="temple", cascade="all, delete-orphan")
    festivals: Mapped[List["TempleFestival"]] = relationship("TempleFestival", back_populates="temple", cascade="all, delete-orphan")
    aarti_sessions: Mapped[List["TempleAartiSession"]] = relationship("TempleAartiSession", back_populates="temple", cascade="all, delete-orphan")
    transport_routes: Mapped[List["TempleTransport"]] = relationship("TempleTransport", back_populates="temple", cascade="all, delete-orphan")
    media: Mapped[List["TempleMedia"]] = relationship("TempleMedia", back_populates="temple", cascade="all, delete-orphan")
    coords: Mapped[List["TempleCoords"]] = relationship("TempleCoords", back_populates="temple", cascade="all, delete-orphan")


class TempleMetadata(Base):
    __tablename__ = "temple_metadata"
    __table_args__ = (UniqueConstraint("temple_id", "language_code", name="uq_temple_metadata_lang"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temple_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("temples.id", ondelete="CASCADE"), nullable=False, index=True)
    language_code: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    about: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mythological_significance: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    history: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    architecture: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sacred_rituals: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pilgrimage_circuit: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    temple: Mapped["Temple"] = relationship("Temple", back_populates="metadata_records")


class TempleAlias(Base):
    __tablename__ = "temple_aliases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temple_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("temples.id", ondelete="CASCADE"), nullable=False, index=True)
    alias_text: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    alias_type: Mapped[AliasType] = mapped_column(Enum(AliasType), default=AliasType.NAME_ALIAS)
    match_mode: Mapped[MatchMode] = mapped_column(Enum(MatchMode), default=MatchMode.INCLUDES)
    priority: Mapped[int] = mapped_column(Integer, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    temple: Mapped["Temple"] = relationship("Temple", back_populates="aliases")


class TempleOfficialLink(Base):
    __tablename__ = "temple_official_links"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temple_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("temples.id", ondelete="CASCADE"), nullable=False, index=True)
    link_type: Mapped[OfficialLinkType] = mapped_column(Enum(OfficialLinkType), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    temple: Mapped["Temple"] = relationship("Temple", back_populates="official_links")


class TempleDarshanDetails(Base):
    __tablename__ = "temple_darshan_details"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temple_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("temples.id", ondelete="CASCADE"), nullable=False, unique=True)
    opening_time: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    closing_time: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    general_darshan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    vip_darshan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    seasonal_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    temple: Mapped["Temple"] = relationship("Temple", back_populates="darshan_details")


class TempleFacility(Base):
    __tablename__ = "temple_facilities"
    __table_args__ = (UniqueConstraint("temple_id", "facility_key", name="uq_temple_facility"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temple_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("temples.id", ondelete="CASCADE"), nullable=False, index=True)
    facility_key: Mapped[FacilityKey] = mapped_column(Enum(FacilityKey), nullable=False)
    custom_label: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    temple: Mapped["Temple"] = relationship("Temple", back_populates="facilities")


class TempleVisitorGuideline(Base):
    __tablename__ = "temple_visitor_guidelines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temple_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("temples.id", ondelete="CASCADE"), nullable=False, index=True)
    language_code: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    icon: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    temple: Mapped["Temple"] = relationship("Temple", back_populates="guidelines")
    points: Mapped[List["TempleGuidelinePoint"]] = relationship("TempleGuidelinePoint", back_populates="guideline", cascade="all, delete-orphan")


class TempleGuidelinePoint(Base):
    __tablename__ = "temple_guideline_points"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    guideline_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("temple_visitor_guidelines.id", ondelete="CASCADE"), nullable=False, index=True)
    point_text: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    guideline: Mapped["TempleVisitorGuideline"] = relationship("TempleVisitorGuideline", back_populates="points")


class TempleFestival(Base):
    __tablename__ = "temple_festivals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temple_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("temples.id", ondelete="CASCADE"), nullable=False, index=True)
    language_code: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    date_rule: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    temple: Mapped["Temple"] = relationship("Temple", back_populates="festivals")


class TempleAartiSession(Base):
    __tablename__ = "temple_aarti_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temple_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("temples.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    time_start: Mapped[str] = mapped_column(String(100), nullable=False)
    time_end: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    session_type: Mapped[SessionType] = mapped_column(Enum(SessionType), default=SessionType.MORNING)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    temple: Mapped["Temple"] = relationship("Temple", back_populates="aarti_sessions")


class TempleTransport(Base):
    __tablename__ = "temple_transport"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temple_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("temples.id", ondelete="CASCADE"), nullable=False, index=True)
    language_code: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    transport_type: Mapped[TransportType] = mapped_column(Enum(TransportType), nullable=False)
    route_description: Mapped[str] = mapped_column(Text, nullable=False)
    nearest_hub_name: Mapped[str] = mapped_column(String(255), nullable=False)
    distance_from_hub_km: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    temple: Mapped["Temple"] = relationship("Temple", back_populates="transport_routes")


class TempleMedia(Base):
    __tablename__ = "temple_media"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temple_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("temples.id", ondelete="CASCADE"), nullable=False, index=True)
    media_type: Mapped[MediaType] = mapped_column(Enum(MediaType), default=MediaType.IMAGE)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    temple: Mapped["Temple"] = relationship("Temple", back_populates="media")


class TempleCoords(Base):
    __tablename__ = "temple_coords"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temple_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("temples.id", ondelete="CASCADE"), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    coord_type: Mapped[CoordType] = mapped_column(Enum(CoordType), default=CoordType.MAIN)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    temple: Mapped["Temple"] = relationship("Temple", back_populates="coords")


class ContentAuditLog(Base):
    __tablename__ = "content_audit_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_name: Mapped[str] = mapped_column(String(100), nullable=False)
    record_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    action: Mapped[AuditAction] = mapped_column(Enum(AuditAction), nullable=False)
    changed_by: Mapped[str] = mapped_column(String(255), nullable=False)
    changes_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ContentApprovalQueue(Base):
    __tablename__ = "content_approval_queue"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temple_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("temples.id", ondelete="SET NULL"), nullable=True)
    table_name: Mapped[str] = mapped_column(String(100), nullable=False)
    record_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    payload_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    status: Mapped[ApprovalStatus] = mapped_column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING)
    submitted_by: Mapped[str] = mapped_column(String(255), nullable=False)
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
