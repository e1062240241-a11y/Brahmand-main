"""
One-shot fix: re-sync all vendor_admin_reviews snapshots.

Normalises kyc_status enum values → plain strings and rewrites the
review_status field so the admin panel query ('review_status' == 'pending')
can find submitted vendors.

Run:
  cd /Users/Developer/Desktop/Brahmand-main\ 2/backend
  .venv/bin/python fix_vendor_kyc_snapshots.py
"""

import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from config.firebase_config import get_firestore
from config.firestore_db import FirestoreDB


def _normalize(raw) -> str:
    if raw is None:
        return ''
    if hasattr(raw, 'value'):
        return str(raw.value).lower()
    return str(raw).lower()


def _build_snapshot(vendor: dict, user: dict = None) -> dict:
    kyc_str = _normalize(vendor.get('kyc_status'))
    is_pending = not kyc_str or kyc_str in ('pending', 'manual_review', 'none', '')
    
    # Pull government ID documents from owner user document if they are missing in the vendor document
    aadhar_url = vendor.get('aadhar_url')
    pan_url = vendor.get('pan_url')
    face_scan_url = vendor.get('face_scan_url')
    
    if user:
        id_type = user.get('kyc_id_type')
        id_photo = user.get('kyc_id_photo')
        selfie_photo = user.get('kyc_selfie_photo')
        if not aadhar_url and id_type == 'aadhaar' and id_photo:
            aadhar_url = id_photo
        if not pan_url and id_type == 'pan' and id_photo:
            pan_url = id_photo
        if not face_scan_url and id_type == 'pan' and selfie_photo:
            face_scan_url = selfie_photo
            
    review_status = 'pending' if is_pending else ('approved' if kyc_str == 'verified' else kyc_str)

    return {
        'vendor_id':               vendor.get('id'),
        'owner_id':                vendor.get('owner_id'),
        'owner_name':              vendor.get('owner_name'),
        'business_name':           vendor.get('business_name'),
        'years_in_business':       vendor.get('years_in_business'),
        'categories':              vendor.get('categories', []),
        'full_address':            vendor.get('full_address'),
        'location_link':           vendor.get('location_link'),
        'phone_number':            vendor.get('phone_number'),
        'latitude':                vendor.get('latitude'),
        'longitude':               vendor.get('longitude'),
        'photos':                  vendor.get('photos', []),
        'business_description':    vendor.get('business_description'),
        'aadhar_url':              aadhar_url,
        'pan_url':                 pan_url,
        'face_scan_url':           face_scan_url,
        'business_gallery_images': vendor.get('business_gallery_images', []),
        'menu_items':              vendor.get('menu_items', []),
        'offers_home_delivery':    vendor.get('offers_home_delivery', False),
        'kyc_status':              kyc_str or 'pending',
        'kyc_request_no':          vendor.get('kyc_request_no'),
        'aadhaar_otp_verified_at': vendor.get('aadhaar_otp_verified_at'),
        'aadhaar_reference_id':    vendor.get('aadhaar_reference_id'),
        'review_status':           review_status,
        'review_state':            'needs_admin_action' if is_pending else 'closed',
        'updated_at':              (
            vendor.get('updated_at') or
            vendor.get('created_at') or
            datetime.utcnow().isoformat() + 'Z'
        ),
    }


async def run():
    client = await get_firestore()
    db = FirestoreDB(client)

    print("Fetching all vendors …")
    vendors = await db.query_documents('vendors')
    print(f"  Total: {len(vendors)}\n")

    pending = verified = other = 0
    for v in vendors:
        vid = v.get('id')
        if not vid:
            continue
            
        owner_id = v.get('owner_id')
        user = None
        if owner_id:
            user = await db.get_document('users', owner_id)
            
        snap = _build_snapshot(v, user)
        await db.set_document('vendor_admin_reviews', vid, snap)

        rs = snap['review_status']
        label = f"{vid[:12]}… {v.get('business_name', '?'):30s}  kyc={v.get('kyc_status')!r} → review_status={rs!r}"
        if rs == 'pending':
            pending += 1
            print(f"  🟡 PENDING  {label}")
        elif rs in ('verified', 'approved'):
            verified += 1
            print(f"  ✅ VERIFIED {label}")
        else:
            other += 1
            print(f"  ⚪ {rs.upper():8s} {label}")

    print(f"\n✔ Resynced {len(vendors)} vendor snapshot(s).")
    print(f"  Pending : {pending}")
    print(f"  Verified: {verified}")
    print(f"  Other   : {other}")
    print("\nRefresh the admin panel — pending/verified vendor KYC should now appear correctly.")


if __name__ == '__main__':
    asyncio.run(run())
