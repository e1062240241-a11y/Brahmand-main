"""
Krishna RAG (Retrieval-Augmented Generation) Service.

Primary path  : ChromaDB Cloud (vector store) + Gemini embeddings.
Fallback path : Local Bhagavad Gita JSON files (keyword/TF-IDF matching).

The fallback activates automatically whenever:
  - chromadb package is not installed
  - ChromaDB Cloud is unreachable
  - Gemini embedding API is exhausted / erroring
  - The collection is empty

Every failure reason is logged explicitly (no silent swallowing).
"""
import asyncio
import json
import logging
import math
import os
import re
from pathlib import Path
from typing import List, Optional

logger = logging.getLogger(__name__)

# ── ChromaDB config ──────────────────────────────────────────────────────────
CHROMA_API_KEY    = os.environ["CHROMA_API_KEY"]
CHROMA_TENANT     = os.environ["CHROMA_TENANT"]
CHROMA_DATABASE   = os.environ.get("CHROMA_DATABASE", "default_database")
CHROMA_COLLECTION = "krishna_gita_knowledge"

# ── Gemini embedding model ───────────────────────────────────────────────────
GEMINI_EMBEDDING_MODEL = "gemini-embedding-001"

# ── Local Gita JSON fallback ─────────────────────────────────────────────────
_LOCAL_GITA_DIR = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "bhavykhatri DharmicData bhavykhatri-AddTransForGita SrimadBhagvadGita"
)

# Preferred English translators in order; first available value is used.
_PREFERRED_TRANSLATORS = [
    "swami gambirananda",
    "swami tejomayananda",
    "swami adidevananda",
    "swami ramsukhdas",
    "sri harikrishnadas goenka",
]

# Cached flat list of all verses across all 18 chapters.
_local_verse_cache: Optional[List[dict]] = None

# Lazy ChromaDB singletons.
_chroma_client = None
_collection    = None


# ═══════════════════════════════════════════════════════════════════════════════
# ChromaDB helpers
# ═══════════════════════════════════════════════════════════════════════════════

def _get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        try:
            import chromadb  # noqa: F401 — checked here so error is explicit
        except ModuleNotFoundError:
            logger.error(
                "[RAG] chromadb package is NOT installed. "
                "Run: pip install chromadb. Falling back to local JSON retrieval."
            )
            raise
        _chroma_client = chromadb.HttpClient(
            ssl=True,
            host="api.trychroma.com",
            tenant=CHROMA_TENANT,
            database=CHROMA_DATABASE,
            headers={"x-chroma-token": CHROMA_API_KEY},
        )
    return _chroma_client


def _get_collection():
    global _collection
    if _collection is None:
        client = _get_chroma_client()
        _collection = client.get_or_create_collection(
            name=CHROMA_COLLECTION,
            metadata={"hnsw:space": "cosine", "description": "Bhagavad Gita shlokas for My Krishna RAG"},
        )
        count = _collection.count()
        if count == 0:
            logger.warning(
                "[RAG] ChromaDB collection '%s' is EMPTY (0 documents). "
                "Seed it with seed_krishna_db.py. Falling back to local JSON retrieval.",
                CHROMA_COLLECTION,
            )
        else:
            logger.info("[RAG] ChromaDB collection ready: %s (count=%d)", CHROMA_COLLECTION, count)
    return _collection


def _embed_query_with_gemini(query: str) -> List[float]:
    try:
        from google import genai
        from google.genai import types as genai_types
    except ModuleNotFoundError:
        logger.error("[RAG] google-genai package not installed. Cannot generate embeddings.")
        raise

    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        logger.error("[RAG] GEMINI_API_KEY not set in environment.")
        raise ValueError("GEMINI_API_KEY not set")

    client = genai.Client(api_key=gemini_key)
    try:
        result = client.models.embed_content(
            model=GEMINI_EMBEDDING_MODEL,
            contents=query,
            config=genai_types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
        )
        if hasattr(result, "embedding") and result.embedding and getattr(result.embedding, "values", None):
            return result.embedding.values
        if result.embeddings and len(result.embeddings) > 0 and getattr(result.embeddings[0], "values", None):
            return result.embeddings[0].values
        raise ValueError("Gemini API returned empty embeddings.")
    except Exception as e:
        logger.error(
            "[RAG] Gemini embedding failed for query '%s...': %s. "
            "Likely cause: API quota exhausted (429) or invalid key.",
            query[:40], e,
        )
        raise


# ═══════════════════════════════════════════════════════════════════════════════
# Local JSON fallback retrieval (TF-IDF keyword matching)
# ═══════════════════════════════════════════════════════════════════════════════

def _load_local_verses() -> List[dict]:
    """Load and cache all 18 chapters from local JSON files."""
    global _local_verse_cache
    if _local_verse_cache is not None:
        return _local_verse_cache

    verses: List[dict] = []
    if not _LOCAL_GITA_DIR.exists():
        logger.error("[RAG-Fallback] Local Gita data directory not found: %s", _LOCAL_GITA_DIR)
        _local_verse_cache = []
        return []

    for chapter_num in range(1, 19):
        path = _LOCAL_GITA_DIR / f"bhagavad_gita_chapter_{chapter_num}.json"
        if not path.exists():
            logger.warning("[RAG-Fallback] Chapter file missing: %s", path.name)
            continue
        try:
            with path.open("r", encoding="utf-8") as f:
                data = json.load(f)
            rows = data.get("BhagavadGitaChapter", [])
            for row in rows:
                if not isinstance(row, dict):
                    continue
                # Pick best available English translation
                trans_dict = row.get("translations") or {}
                translation = ""
                for translator in _PREFERRED_TRANSLATORS:
                    val = trans_dict.get(translator, "")
                    if val and "No such translation" not in val and len(val.strip()) > 20:
                        translation = val.strip()
                        break
                if not translation:
                    # Last resort: any non-empty value
                    for val in trans_dict.values():
                        if val and "No such translation" not in str(val) and len(str(val).strip()) > 20:
                            translation = str(val).strip()
                            break
                if not translation:
                    continue  # Skip verses with no usable translation

                # Commentary snippet (first 200 chars of first available commentary)
                comm_dict = row.get("commentaries") or {}
                commentary_snippet = ""
                for comm_val in comm_dict.values():
                    if comm_val and len(str(comm_val).strip()) > 10:
                        commentary_snippet = str(comm_val).strip()[:200]
                        break

                verses.append({
                    "chapter": row.get("chapter", chapter_num),
                    "verse":   row.get("verse", "?"),
                    "sanskrit_text": str(row.get("text", ""))[:150],
                    "translation": translation,
                    "commentary_snippet": commentary_snippet,
                })
        except Exception as e:
            logger.warning("[RAG-Fallback] Failed to load chapter %d: %s", chapter_num, e)

    _local_verse_cache = verses
    logger.info("[RAG-Fallback] Loaded %d verses from local Gita JSON files.", len(verses))
    return verses


def _tokenize(text: str) -> List[str]:
    """Simple word tokenizer — lowercase, strip punctuation."""
    return re.findall(r"[a-z]+", text.lower())


def _score_verse_against_query(verse: dict, query_tokens: List[str], idf: dict) -> float:
    """TF-IDF-inspired score: sum of IDF weights for matching tokens."""
    doc_text = (verse.get("translation", "") + " " + verse.get("commentary_snippet", "")).lower()
    doc_tokens = _tokenize(doc_text)
    doc_set = set(doc_tokens)
    score = sum(idf.get(tok, 0.0) for tok in query_tokens if tok in doc_set)
    return score


# Precomputed IDF over all verses (built once on first call).
_idf_cache: Optional[dict] = None


def _get_idf() -> dict:
    global _idf_cache
    if _idf_cache is not None:
        return _idf_cache

    verses = _load_local_verses()
    if not verses:
        _idf_cache = {}
        return {}

    N = len(verses)
    df: dict = {}
    for verse in verses:
        doc_text = (verse.get("translation", "") + " " + verse.get("commentary_snippet", "")).lower()
        for tok in set(_tokenize(doc_text)):
            df[tok] = df.get(tok, 0) + 1

    _idf_cache = {tok: math.log((N + 1) / (freq + 1)) for tok, freq in df.items()}
    return _idf_cache


def _local_retrieve(query: str, top_k: int = 5) -> List[dict]:
    """Retrieve top-k relevant Gita verses from local JSON using TF-IDF scoring."""
    verses = _load_local_verses()
    if not verses:
        logger.error("[RAG-Fallback] No local verses available for retrieval.")
        return []

    idf = _get_idf()
    query_tokens = _tokenize(query)

    # Remove stopwords from query tokens to avoid noise
    stopwords = {"i", "am", "is", "the", "a", "an", "to", "of", "and", "in", "my", "me", "do"}
    query_tokens = [t for t in query_tokens if t not in stopwords]

    if not query_tokens:
        logger.warning("[RAG-Fallback] Query has no meaningful tokens after stopword removal.")
        return []

    scored = [(verse, _score_verse_against_query(verse, query_tokens, idf)) for verse in verses]
    scored = [(v, s) for v, s in scored if s > 0.0]
    scored.sort(key=lambda x: x[1], reverse=True)

    results = []
    for verse, score in scored[:top_k]:
        results.append({
            "chapter":             verse["chapter"],
            "verse":               verse["verse"],
            "text":                verse.get("sanskrit_text", ""),
            "translation":         verse["translation"],
            "commentary_snippet":  verse.get("commentary_snippet", ""),
            "relevance_score":     round(score, 3),
            "source":              "local_json",
        })

    logger.info(
        "[RAG-Fallback] Retrieved %d verses from local JSON for query: '%s...'",
        len(results), query[:50],
    )
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# Public API — used by main.py
# ═══════════════════════════════════════════════════════════════════════════════

def retrieve_relevant_shlokas(query: str, top_k: int = 5) -> List[dict]:
    """
    Retrieve top-k relevant Bhagavad Gita shlokas.

    Primary path  : ChromaDB Cloud + Gemini embeddings.
    Fallback path : Local JSON TF-IDF matching (activates on any primary failure).

    Every failure is logged with an explicit reason — nothing is swallowed silently.
    """
    # ── Primary: ChromaDB + Gemini ──────────────────────────────────────────
    try:
        collection = _get_collection()

        if collection.count() == 0:
            logger.warning(
                "[RAG] ChromaDB collection is empty — skipping vector search, "
                "activating local JSON fallback."
            )
            raise RuntimeError("collection_empty")

        query_embedding = _embed_query_with_gemini(query)

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, collection.count()),
            include=["documents", "metadatas", "distances"],
        )

        shlokas = []
        docs      = (results.get("documents") or [[]])[0] if results else []
        metas     = (results.get("metadatas") or [[]])[0] if results else []
        distances = (results.get("distances") or [[]])[0] if results else []

        for doc, meta, dist in zip(docs, metas, distances):
            if dist < 0.7:
                shlokas.append({
                    "chapter":            meta.get("chapter"),
                    "verse":              meta.get("verse"),
                    "text":               meta.get("sanskrit_text", ""),
                    "translation":        doc,
                    "commentary_snippet": meta.get("commentary_snippet", ""),
                    "relevance_score":    round(1 - dist, 3),
                    "source":             "chromadb",
                })

        logger.info(
            "[RAG] ChromaDB retrieved %d shlokas (passed threshold) for query: '%s...'",
            len(shlokas), query[:50],
        )

        if shlokas:
            return shlokas

        # Vector search returned results but all were below threshold — fallback
        logger.warning(
            "[RAG] All %d ChromaDB results below cosine threshold 0.7 — "
            "activating local JSON fallback.",
            len(docs),
        )

    except RuntimeError as re_err:
        if "collection_empty" not in str(re_err):
            logger.error("[RAG] Unexpected RuntimeError in ChromaDB path: %s — activating local JSON fallback.", re_err)
    except Exception as e:
        logger.error(
            "[RAG] ChromaDB/Gemini retrieval failed: %s — activating local JSON fallback.",
            e,
        )

    # ── Fallback: Local JSON TF-IDF ─────────────────────────────────────────
    return _local_retrieve(query, top_k)


async def retrieve_relevant_shlokas_async(query: str, top_k: int = 5) -> List[dict]:
    """Async wrapper — runs retrieval in a thread so it doesn't block the event loop."""
    return await asyncio.to_thread(retrieve_relevant_shlokas, query, top_k)


def build_rag_context(shlokas: List[dict]) -> str:
    """Format retrieved shlokas into a context string for the LLM system prompt."""
    if not shlokas:
        return ""

    lines = ["[RELEVANT GITA WISDOM — use this to ground your response]\n"]
    for s in shlokas:
        chapter = s.get("chapter", "?")
        verse   = s.get("verse",   "?")
        translation        = s.get("translation", "")
        commentary         = s.get("commentary_snippet", "")

        lines.append(f"BG {chapter}.{verse}: {translation}")
        if commentary:
            lines.append(f"  → {commentary[:200]}...")
        lines.append("")

    return "\n".join(lines)


def is_collection_populated() -> bool:
    """Health check: returns True only if ChromaDB collection has data."""
    try:
        collection = _get_collection()
        count = collection.count()
        if count == 0:
            logger.warning("[RAG] ChromaDB collection is empty (count=0).")
        return count > 0
    except Exception as e:
        logger.error("[RAG] ChromaDB health check failed: %s", e)
        return False


# ═══════════════════════════════════════════════════════════════════════════════
# Startup diagnostics
# ═══════════════════════════════════════════════════════════════════════════════

def run_startup_diagnostics() -> dict:
    """
    Called once at server startup. Logs the state of every RAG dependency
    and returns a summary dict. Does NOT raise — always safe to call.
    """
    report = {
        "chromadb_installed":    False,
        "chromadb_connected":    False,
        "collection_exists":     False,
        "collection_count":      0,
        "gemini_key_set":        bool(os.environ.get("GEMINI_API_KEY")),
        "local_verses_loaded":   0,
        "rag_mode":              "unknown",
    }

    # 1. chromadb installed?
    try:
        import chromadb  # noqa: F401
        report["chromadb_installed"] = True
    except ModuleNotFoundError:
        logger.error("[RAG] chromadb package is not installed.")

    # 2. ChromaDB connectivity + collection
    if report["chromadb_installed"]:
        try:
            col = _get_collection()
            report["chromadb_connected"] = True
            report["collection_exists"]  = True
            report["collection_count"]   = col.count()
        except Exception as e:
            logger.error("[RAG] ChromaDB connection failed: %s", e)

    # 3. Gemini key
    if not report["gemini_key_set"]:
        logger.error("[RAG] GEMINI_API_KEY not set.")

    # 4. Local JSON fallback
    verses = _load_local_verses()
    report["local_verses_loaded"] = len(verses)

    # 5. Determine effective RAG mode
    if report["chromadb_connected"] and report["collection_count"] > 0 and report["gemini_key_set"]:
        report["rag_mode"] = "chromadb_primary"
    elif report["local_verses_loaded"] > 0:
        report["rag_mode"] = "local_json_fallback"
    else:
        report["rag_mode"] = "disabled"

    return report
