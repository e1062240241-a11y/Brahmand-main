import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from middleware.security import verify_token
from config.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jaap", tags=["Jaap & Certificates"])

# Milestones configurations
# For 'hanuman', the count represents number of complete Hanuman Chalisa readings.
# For others, count represents number of mantra repetitions.
MANTRA_MILESTONES = {
    "hanuman": {
        "counts": {
            "bronze": 1,
            "silver": 11,
            "gold": 108,
            "diamond": 1008
        },
        "durations": {
            "bronze": 900,       # 15 minutes
            "silver": 10000,     # ~2.7 hours
            "gold": 100000,      # ~27.7 hours
            "diamond": 1000000   # ~277 hours
        }
    },
    "default": {
        "counts": {
            "bronze": 108,       # 1 Mala
            "silver": 1008,      # 10 Malas
            "gold": 10008,       # 100 Malas
            "diamond": 100008    # 1000 Malas
        },
        "durations": {
            "bronze": 600,       # 10 minutes
            "silver": 3600,      # 1 hour
            "gold": 36000,       # 10 hours
            "diamond": 360000    # 100 hours
        }
    }
}

def get_mantra_title(mantra_type: str) -> str:
    mapping = {
        "hanuman": "Hanuman Chalisa",
        "gayatri": "Gayatri Mantra",
        "shiva": "Om Namah Shivaya",
        "krishna": "Hare Krishna Maha Mantra",
        "ganesh": "Ganesh Mantra",
        "laxmi": "Laxmi Mantra",
        "mrityunjaya": "Mahamrityunjaya Mantra"
    }
    return mapping.get(mantra_type.lower(), f"{mantra_type.capitalize()} Mantra")

@router.post("/record")
async def record_jaap(
    data: dict,
    token_data: dict = Depends(verify_token)
):
    """
    Record a completed jaap session and dynamically check/unlock certificates.
    Request body:
    {
        "mantra_type": "krishna",
        "count_increment": 108,
        "time_spent_seconds": 600
    }
    """
    user_id = token_data["user_id"]
    mantra_type = data.get("mantra_type")
    count_increment = int(data.get("count_increment", 0))
    time_spent_seconds = float(data.get("time_spent_seconds", 0.0))

    if not mantra_type:
        raise HTTPException(status_code=400, detail="mantra_type is required")

    mantra_type = mantra_type.lower()
    db = await get_db()

    # Get User Name
    user_name = "Priya Devotee"
    try:
        user_data = await db.get_document('users', user_id)
        if user_data:
            user_name = user_data.get("name") or user_data.get("full_name") or user_data.get("displayName") or "Priya Devotee"
    except Exception as e:
        logger.warning(f"Error fetching user name for certificate: {e}")

    # Fetch existing stats or create default
    stats_data = await db.get_document('user_jaap_stats', user_id) or {}

    # Get overall totals
    total_chants = stats_data.get("total_chants", 0) + count_increment
    total_duration = stats_data.get("total_duration", 0.0) + time_spent_seconds

    # Get mantra specific stats
    mantra_stats = stats_data.get(mantra_type, {"count": 0, "duration": 0.0})
    new_count = mantra_stats.get("count", 0) + count_increment
    new_duration = mantra_stats.get("duration", 0.0) + time_spent_seconds

    # Update stats dictionary
    stats_data["total_chants"] = total_chants
    stats_data["total_duration"] = total_duration
    stats_data[mantra_type] = {
        "count": new_count,
        "duration": new_duration,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }

    # Save stats
    await db.create_document('user_jaap_stats', stats_data, doc_id=user_id, overwrite=True)

    # Check for unlocked certificates
    newly_unlocked = []
    milestone_config = MANTRA_MILESTONES.get(mantra_type, MANTRA_MILESTONES["default"])

    for tier in ["bronze", "silver", "gold", "diamond"]:
        # 1. Count milestone
        count_threshold = milestone_config["counts"][tier]
        if new_count >= count_threshold:
            cert_id = f"{user_id}_{mantra_type}_{tier}_count"
            existing_cert = await db.get_document('jaap_certificates', cert_id)
            if not existing_cert:
                # Generate unique serial number
                serial_num = f"SL-{mantra_type.upper()}-{tier.upper()}-C{str(uuid.uuid4().hex[:6]).upper()}"
                cert_data = {
                    "certificate_id": cert_id,
                    "user_id": user_id,
                    "user_name": user_name,
                    "mantra_type": mantra_type,
                    "mantra_title": get_mantra_title(mantra_type),
                    "tier": tier,
                    "type": "count",
                    "milestone_value": count_threshold,
                    "serial_number": serial_num,
                    "earned_at": datetime.now(timezone.utc).isoformat(),
                    "signature": "Sanatan Lok Dharma Board"
                }
                await db.create_document('jaap_certificates', cert_data, doc_id=cert_id, overwrite=True)
                newly_unlocked.append(cert_data)

        # 2. Duration milestone
        duration_threshold = milestone_config["durations"][tier]
        if new_duration >= duration_threshold:
            cert_id = f"{user_id}_{mantra_type}_{tier}_duration"
            existing_cert = await db.get_document('jaap_certificates', cert_id)
            if not existing_cert:
                # Generate unique serial number
                serial_num = f"SL-{mantra_type.upper()}-{tier.upper()}-T{str(uuid.uuid4().hex[:6]).upper()}"
                cert_data = {
                    "certificate_id": cert_id,
                    "user_id": user_id,
                    "user_name": user_name,
                    "mantra_type": mantra_type,
                    "mantra_title": get_mantra_title(mantra_type),
                    "tier": tier,
                    "type": "duration",
                    "milestone_value": duration_threshold,
                    "serial_number": serial_num,
                    "earned_at": datetime.now(timezone.utc).isoformat(),
                    "signature": "Sanatan Lok Dharma Board"
                }
                await db.create_document('jaap_certificates', cert_data, doc_id=cert_id, overwrite=True)
                newly_unlocked.append(cert_data)

    return {
        "status": "success",
        "overall_stats": {
            "total_chants": total_chants,
            "total_duration_seconds": total_duration
        },
        "mantra_stats": {
            "mantra_type": mantra_type,
            "count": new_count,
            "duration_seconds": new_duration
        },
        "newly_unlocked_certificates": newly_unlocked
    }

@router.get("/certificates")
async def get_certificates(token_data: dict = Depends(verify_token)):
    """
    Get all earned certificates for the current user.
    """
    user_id = token_data["user_id"]
    db = await get_db()
    
    certs = []
    try:
        certs = await db.query_documents('jaap_certificates', filters=[('user_id', '==', user_id)])
    except Exception as e:
        logger.error(f"Error fetching user certificates: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch certificates")

    return {
        "status": "success",
        "certificates": certs
    }

@router.get("/stats")
async def get_jaap_stats(token_data: dict = Depends(verify_token)):
    """
    Get all jaap statistics for the current user.
    """
    user_id = token_data["user_id"]
    db = await get_db()

    try:
        stats_data = await db.get_document('user_jaap_stats', user_id)
        if stats_data:
            return {
                "status": "success",
                "stats": stats_data
            }
        return {
            "status": "success",
            "stats": {
                "total_chants": 0,
                "total_duration": 0.0
            }
        }
    except Exception as e:
        logger.error(f"Error fetching jaap statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")
