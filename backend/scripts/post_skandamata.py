"""
Scheduled Post Publisher for Brahmand Official Account — Navratri Day 5 (Maa Skandamata).
Publishes the post immediately or verifies via --dry-run.
"""
import asyncio
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Load .env
load_dotenv(backend_dir / '.env')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("scheduled_poster")

CAPTION = """🌸 जय माता दी 🌸
नवरात्रि पंचम दिवस — माँ स्कंदमाता का पावन आशीर्वाद 🙏✨

ॐ देवी स्कन्दमातायै नमः॥

माँ स्कंदमाता करुणा, वात्सल्य और अपार शक्ति की प्रतीक हैं। भगवान कार्तिकेय (स्कंद) को अपनी गोद में विराजित कर भक्तों पर स्नेह बरसाने वाली माँ की असीम कृपा से आपके जीवन में सुख, शांति, समृद्धि, उत्तम स्वास्थ्य और पारिवारिक सौहार्द की प्राप्ति हो।

📖 आज ब्रह्मांड ऐप पर जानें:
• माँ स्कंदमाता की पावन कथा व स्वरूप
• पंचम दिवस की विशेष पूजा विधि व शुभ मुहूर्त
• दिव्य आरती एवं प्रिय भोग

समस्त ब्रह्मांड परिवार की ओर से आपको नवरात्रि के पंचम दिवस की हार्दिक शुभकामनाएँ! 🌺🚩

#Brahmand #Navratri #MaaSkandamata #NavratriDay5 #JaiMataDi #Bhakti #Sanatan"""

IMAGE_FILE = backend_dir / "scripts" / "scheduled_posts" / "skandamata_navratri_day5.jpg"
BRAHMAND_USER_ID = "udSiyqAWc2OtGRke6AWR"

async def publish_post(dry_run: bool = False):
    from main import (
        get_db,
        _upload_post_media_to_bunny,
        _create_post_document,
        _generate_image_thumbnail,
        _upload_post_media_file_to_bunny
    )
    from tempfile import NamedTemporaryFile

    logger.info(f"Starting post publisher (dry_run={dry_run})...")
    if not IMAGE_FILE.exists():
        logger.error(f"Image file does not exist: {IMAGE_FILE}")
        sys.exit(1)

    db = await get_db()
    user = await db.get_document('users', BRAHMAND_USER_ID)
    if not user:
        logger.error(f"Could not find Brahmand user with ID {BRAHMAND_USER_ID}")
        sys.exit(1)

    logger.info(f"Target account verified: Name='{user.get('name')}', sl_id='{user.get('sl_id')}', is_official={user.get('is_official')}")

    if dry_run:
        logger.info("Dry run verified successfully. Ready to post.")
        return

    with open(IMAGE_FILE, "rb") as f:
        file_bytes = f.read()

    content_type = "image/jpeg"
    base_url = "https://brahmand.app"

    logger.info(f"Uploading image ({len(file_bytes)} bytes) to BunnyCDN...")
    media_url, object_path = await _upload_post_media_to_bunny(
        user_id=BRAHMAND_USER_ID,
        file_bytes=file_bytes,
        content_type=content_type,
        base_url=base_url
    )
    logger.info(f"Media uploaded: {media_url} (path: {object_path})")

    # Generate thumbnail
    image_thumbnail_url = None
    temp_thumb = NamedTemporaryFile(delete=False, suffix='.jpg')
    temp_thumb.close()
    try:
        thumb_bytes = _generate_image_thumbnail(file_bytes, 400)
        with open(temp_thumb.name, 'wb') as tf:
            tf.write(thumb_bytes)
        image_thumbnail_url, _ = await _upload_post_media_file_to_bunny(
            BRAHMAND_USER_ID,
            temp_thumb.name,
            'image/jpeg',
            base_url
        )
        logger.info(f"Thumbnail uploaded: {image_thumbnail_url}")
    except Exception as e:
        logger.warning(f"Thumbnail generation/upload skipped: {e}")
    finally:
        if os.path.exists(temp_thumb.name):
            os.unlink(temp_thumb.name)

    from PIL import Image
    im = Image.open(IMAGE_FILE)
    width, height = im.size

    metadata = {
        'width': width,
        'height': height,
    }
    if image_thumbnail_url:
        metadata['thumbnail_url'] = image_thumbnail_url

    logger.info("Creating post document in Firestore...")
    post_doc = await _create_post_document(
        db=db,
        user_id=BRAHMAND_USER_ID,
        user=user,
        media_url=media_url,
        object_path=object_path,
        media_type='image',
        content_type=content_type,
        caption=CAPTION,
        source='official_schedule',
        filter_name=None,
        metadata=metadata,
        category='festivals',
        community_level='national',
    )

    logger.info(f"✅ POST CREATED SUCCESSFULLY! Post ID: {post_doc.get('id')}")
    print(f"\nSUCCESS: Post ID = {post_doc.get('id')}\n")
    return post_doc.get('id')

if __name__ == "__main__":
    is_dry = "--dry-run" in sys.argv
    asyncio.run(publish_post(dry_run=is_dry))
