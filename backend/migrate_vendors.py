#!/usr/bin/env python3
"""
Vendor Coordinate Migration Script

Audits all vendor profiles in Firestore and corrects inaccurate vendor coordinates.
Re-geocodes the business address ('full_address') and updates vendor coordinates if:
1. Coordinates are missing or zero.
2. Stored coordinates deviate significantly (> 0.5 km) from the geocoded business address
   (indicating registration-time user GPS was stored instead of the business address).

Idempotent: Subsequent runs will detect 0.0 km discrepancy and skip already accurate records.
"""

import asyncio
import sys
import os
import json
import math
from datetime import datetime

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from main import get_db, _geocode_address

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))

async def run_vendor_coordinate_migration(tolerance_km: float = 0.5):
    db = await get_db()
    vendors = await db.query_documents('vendors')
    
    migrated_records = []
    skipped_records = []

    print(f"\n================================================================================")
    print(f"STARTING VENDOR COORDINATE MIGRATION AUDIT ({len(vendors)} TOTAL VENDORS)")
    print(f"Tolerance Threshold: {tolerance_km} km")
    print(f"================================================================================\n")

    for vendor in vendors:
        v_id = vendor.get('id')
        name = vendor.get('business_name', 'Unnamed Business')
        address = (vendor.get('full_address') or '').strip()
        stored_lat = vendor.get('latitude')
        stored_lng = vendor.get('longitude')
        is_explicit = vendor.get('is_explicit_location') or vendor.get('is_current_location')

        print(f"Auditing Vendor ID: {v_id} | '{name}'")
        print(f"  - Full Address : '{address}'")
        print(f"  - Stored Coords: ({stored_lat}, {stored_lng})")

        # 1. Skip if no address available
        if not address:
            reason = "No full_address available to geocode"
            print(f"  -> SKIPPED: {reason}\n")
            skipped_records.append({
                'id': v_id,
                'business_name': name,
                'full_address': address,
                'stored_coords': (stored_lat, stored_lng),
                'reason': reason
            })
            continue

        # 2. Skip if explicitly flagged as user map pin choice
        if is_explicit:
            reason = "Explicit map pin / location choice preserved"
            print(f"  -> SKIPPED: {reason}\n")
            skipped_records.append({
                'id': v_id,
                'business_name': name,
                'full_address': address,
                'stored_coords': (stored_lat, stored_lng),
                'reason': reason
            })
            continue

        # 3. Perform geocoding on full_address
        geo_lat, geo_lng = await _geocode_address(address)
        if geo_lat is None or geo_lng is None:
            reason = f"Geocoding service returned null for address: '{address}'"
            print(f"  -> SKIPPED: {reason}\n")
            skipped_records.append({
                'id': v_id,
                'business_name': name,
                'full_address': address,
                'stored_coords': (stored_lat, stored_lng),
                'reason': reason
            })
            continue

        print(f"  - Geocoded Coords: ({geo_lat}, {geo_lng})")

        # Check valid stored coordinates
        valid_stored = (
            stored_lat is not None and stored_lng is not None and
            isinstance(stored_lat, (int, float)) and isinstance(stored_lng, (int, float)) and
            abs(stored_lat) > 0.001 and abs(stored_lng) > 0.001
        )

        should_migrate = False
        reason = ""
        discrepancy_km = 0.0

        if not valid_stored:
            should_migrate = True
            reason = "Missing or zero stored coordinates"
        else:
            discrepancy_km = haversine(stored_lat, stored_lng, geo_lat, geo_lng)
            print(f"  - Discrepancy    : {discrepancy_km:.3f} km")

            if discrepancy_km > tolerance_km:
                should_migrate = True
                reason = f"Discrepancy of {discrepancy_km:.3f} km exceeds threshold ({tolerance_km} km) - registration GPS misplacement detected"

        if should_migrate:
            print(f"  -> MIGRATING: {reason}")
            print(f"     Old: ({stored_lat}, {stored_lng}) => New: ({geo_lat}, {geo_lng})")
            
            update_payload = {
                'latitude': geo_lat,
                'longitude': geo_lng,
                'geocoded_address': address,
                'last_geocoded_at': datetime.utcnow().isoformat() + 'Z'
            }
            
            try:
                await db.update_document('vendors', v_id, update_payload)
                print(f"  -> SUCCESS: Firestore document updated.\n")
                migrated_records.append({
                    'id': v_id,
                    'business_name': name,
                    'full_address': address,
                    'old_coords': (stored_lat, stored_lng),
                    'new_coords': (geo_lat, geo_lng),
                    'discrepancy_km': round(discrepancy_km, 3) if valid_stored else None,
                    'reason': reason
                })
            except Exception as exc:
                err_msg = f"Database update failed: {str(exc)}"
                print(f"  -> ERROR: {err_msg}\n")
                skipped_records.append({
                    'id': v_id,
                    'business_name': name,
                    'reason': err_msg
                })
        else:
            reason = f"Accurate location within tolerance ({discrepancy_km:.3f} km <= {tolerance_km} km)"
            print(f"  -> SKIPPED: {reason}\n")
            skipped_records.append({
                'id': v_id,
                'business_name': name,
                'full_address': address,
                'stored_coords': (stored_lat, stored_lng),
                'geocoded_coords': (geo_lat, geo_lng),
                'discrepancy_km': round(discrepancy_km, 3),
                'reason': reason
            })

    summary = {
        'total_vendors_audited': len(vendors),
        'migrated_count': len(migrated_records),
        'skipped_count': len(skipped_records),
        'migrated_records': migrated_records,
        'skipped_records': skipped_records
    }

    print(f"\n================================================================================")
    print(f"MIGRATION SUMMARY")
    print(f"================================================================================")
    print(f"Total Vendors Audited : {summary['total_vendors_audited']}")
    print(f"Migrated Records      : {summary['migrated_count']}")
    print(f"Skipped Records       : {summary['skipped_count']}")
    print(f"================================================================================\n")

    return summary

if __name__ == "__main__":
    result = asyncio.run(run_vendor_coordinate_migration(tolerance_km=0.5))
    print(json.dumps(result, indent=2))
