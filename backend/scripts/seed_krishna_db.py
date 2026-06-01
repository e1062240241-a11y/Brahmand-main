"""
Seed script: Load all 18 Bhagavad Gita chapters into ChromaDB Cloud.

Run once:
    cd backend
    source .venv/bin/activate
    python scripts/seed_krishna_db.py

Uses Google GenAI (text-embedding-004) for embeddings.
"""
import glob
import json
import logging
import os
import sys
import time
from pathlib import Path

# Add backend root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

import chromadb
from google import genai as genai_new

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("seed_krishna")

# -- Config --
CHROMA_API_KEY = os.environ.get("CHROMA_API_KEY", "ck-4VkTsJANy78AW6spNfLMywoYDNh7R4mkebwYysmZizRh")
CHROMA_TENANT = os.environ.get("CHROMA_TENANT", "9a04c579-4ed1-4f4a-914a-d65b427af626")
CHROMA_DATABASE = os.environ.get("CHROMA_DATABASE", "default_database")
CHROMA_COLLECTION = "krishna_gita_knowledge"
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
EMBEDDING_MODEL = "gemini-embedding-001"
GITA_DATA_DIR = Path(__file__).parent.parent / "data" / "bhavykhatri DharmicData bhavykhatri-AddTransForGita SrimadBhagvadGita"
BATCH_SIZE = 5  # Smaller batches to stay under free tier rate limit
RATE_LIMIT_WAIT = 62  # Seconds to wait on 429 (free tier: 100 req/min)


def get_best_translation(translations: dict) -> str:
    """Pick the most readable English translation."""
    preferred = [
        "swami sivananda",
        "shri purohit swami",
        "dr. s. sankaranarayan",
        "swami gambirananda",
        "swami ramsukhdas",
    ]
    for key in preferred:
        val = translations.get(key, "")
        if val and "did not comment" not in val.lower() and len(val) > 20:
            return val.strip()
    # Fallback: first non-empty
    for val in translations.values():
        if val and "did not comment" not in val.lower() and len(val) > 20:
            return val.strip()
    return ""


def get_commentary_snippet(commentaries: dict) -> str:
    """Extract a short Swami Chinmayananda or Sivananda commentary snippet."""
    preferred = ["Swami Chinmayananda", "Swami Sivananda", "Sri Sridhara Swami"]
    for key in preferred:
        val = commentaries.get(key, "")
        if val and len(val) > 30:
            return val[:400].strip()
    return ""


def embed_batch(texts: list, gemini_client) -> list:
    """Embed a batch of texts — handles 429 rate limits with proper wait."""
    from google.genai import types as genai_types

    for attempt in range(6):  # More retries for rate limits
        try:
            result = gemini_client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=texts,
                config=genai_types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
            )
            return [emb.values for emb in result.embeddings]
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                # Extract retry delay from error if available
                wait_time = RATE_LIMIT_WAIT
                import re
                match = re.search(r"retry in (\d+)\.\d+s", err_str)
                if match:
                    wait_time = int(match.group(1)) + 5
                logger.warning(f"Rate limit hit. Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
            else:
                logger.warning(f"Embedding attempt {attempt+1} failed: {e}")
                time.sleep(2 ** min(attempt, 4))
    raise RuntimeError("Embedding failed after 6 attempts")


def main():
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not set in .env")
        sys.exit(1)

    # Configure Gemini
    gemini_client = genai_new.Client(api_key=GEMINI_API_KEY)

    # Connect to ChromaDB Cloud — first ensure database exists
    logger.info(f"Connecting to ChromaDB Cloud (tenant={CHROMA_TENANT})...")

    # Use admin client to create database if missing
    admin_client = chromadb.HttpClient(
        ssl=True,
        host="api.trychroma.com",
        tenant=CHROMA_TENANT,
        database=CHROMA_DATABASE,
        headers={"x-chroma-token": CHROMA_API_KEY},
    )

    try:
        admin_client._admin_client.get_database(name=CHROMA_DATABASE, tenant=CHROMA_TENANT)
        logger.info(f"Database '{CHROMA_DATABASE}' already exists.")
    except Exception:
        logger.info(f"Creating database '{CHROMA_DATABASE}'...")
        admin_client._admin_client.create_database(name=CHROMA_DATABASE, tenant=CHROMA_TENANT)
        logger.info(f"Database '{CHROMA_DATABASE}' created.")

    client = admin_client

    # Get or create collection
    collection = client.get_or_create_collection(
        name=CHROMA_COLLECTION,
        metadata={"hnsw:space": "cosine", "description": "Bhagavad Gita shlokas for My Krishna RAG"},
    )

    existing_count = collection.count()
    logger.info(f"Collection '{CHROMA_COLLECTION}' has {existing_count} existing documents")

    # Load all 18 chapters
    chapter_files = sorted(glob.glob(str(GITA_DATA_DIR / "bhagavad_gita_chapter_*.json")))
    if not chapter_files:
        logger.error(f"No Gita JSON files found in: {GITA_DATA_DIR}")
        sys.exit(1)

    logger.info(f"Found {len(chapter_files)} chapter files")

    # Fetch ALL existing IDs in one call (fast) — avoid per-shloka GET
    existing_ids: set = set()
    if existing_count > 0:
        logger.info(f"Fetching {existing_count} existing IDs to skip duplicates...")
        existing_result = collection.get(include=[])  # IDs only, no docs/embeddings
        existing_ids = set(existing_result["ids"])
        logger.info(f"Will skip {len(existing_ids)} already-uploaded shlokas")

    # Collect all shlokas that need uploading
    all_ids = []
    all_texts = []
    all_metadatas = []

    for filepath in chapter_files:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        shlokas = data.get("BhagavadGitaChapter", [])
        logger.info(f"Processing {Path(filepath).name}: {len(shlokas)} shlokas")

        for shloka in shlokas:
            chapter = shloka.get("chapter", 0)
            verse = shloka.get("verse", 0)
            sanskrit_text = (shloka.get("text") or "").replace("\n", " ").strip()

            translations = shloka.get("translations", {})
            commentaries = shloka.get("commentaries", {})

            best_translation = get_best_translation(translations)
            commentary_snippet = get_commentary_snippet(commentaries)

            if not best_translation:
                continue  # Skip if no translation

            doc_id = f"bg_{chapter}_{verse}"

            # Skip if already in DB (O(1) set lookup instead of per-doc GET)
            if doc_id in existing_ids:
                continue

            # Document text = translation (what we embed and what gets returned)
            all_ids.append(doc_id)
            all_texts.append(best_translation)
            all_metadatas.append({
                "chapter": chapter,
                "verse": verse,
                "sanskrit_text": sanskrit_text[:500],  # Limit stored size
                "commentary_snippet": commentary_snippet[:400],
                "source": "Bhagavad Gita",
                "reference": f"BG {chapter}.{verse}",
            })

    if not all_ids:
        logger.info("All shlokas already in ChromaDB. Nothing to seed.")
        return

    logger.info(f"Embedding and uploading {len(all_ids)} shlokas to ChromaDB...")

    # Process in batches
    total_batches = (len(all_ids) + BATCH_SIZE - 1) // BATCH_SIZE
    uploaded = 0

    for i in range(0, len(all_ids), BATCH_SIZE):
        batch_ids = all_ids[i : i + BATCH_SIZE]
        batch_texts = all_texts[i : i + BATCH_SIZE]
        batch_metas = all_metadatas[i : i + BATCH_SIZE]

        batch_num = i // BATCH_SIZE + 1
        logger.info(f"Batch {batch_num}/{total_batches} — embedding {len(batch_ids)} shlokas...")

        embeddings = embed_batch(batch_texts, gemini_client)

        collection.upsert(
            ids=batch_ids,
            embeddings=embeddings,
            documents=batch_texts,
            metadatas=batch_metas,
        )

        uploaded += len(batch_ids)
        logger.info(f"  ✓ Uploaded {uploaded}/{len(all_ids)} shlokas")

        # Rate limit: small sleep between batches
        time.sleep(0.5)

    final_count = collection.count()
    logger.info(f"\n🎉 Seeding complete! ChromaDB collection '{CHROMA_COLLECTION}' now has {final_count} shlokas.")


if __name__ == "__main__":
    main()
