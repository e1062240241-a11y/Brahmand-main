import asyncio
import logging
import sys
from pathlib import Path

# Ensure backend package imports work when running from scripts folder.
sys.path.append(str(Path(__file__).resolve().parents[1]))

from config.firebase_config import get_firestore
from config.firestore_db import FirestoreDB

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


async def main() -> None:
    db_client = await get_firestore()
    if not db_client:
        logger.error("Failed to initialize Firestore client. Check GOOGLE_APPLICATION_CREDENTIALS and firebase config.")
        return

    db = FirestoreDB(db_client)
    active_alerts = await db.query_documents('sos_alerts')

    if not active_alerts:
        logger.info('No SOS alert documents found in the database.')
        return

    logger.info(f'Found {len(active_alerts)} SOS alert document(s). Deleting all...')

    deleted = 0
    for alert in active_alerts:
        alert_id = alert.get('id')
        if not alert_id:
            continue
        await db.delete_document('sos_alerts', alert_id)
        deleted += 1

    logger.info(f'Deleted {deleted} SOS alert document(s).')


if __name__ == '__main__':
    asyncio.run(main())
