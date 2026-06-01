"""
Krishna RAG (Retrieval-Augmented Generation) Service.

Uses ChromaDB Cloud as vector store and Google GenAI for embeddings.
Retrieves relevant Bhagavad Gita shlokas to ground Krishna's responses.
"""
import asyncio
import logging
import os
from typing import List, Optional

import chromadb
from chromadb.config import Settings

logger = logging.getLogger(__name__)

# ChromaDB Cloud config
CHROMA_API_KEY = os.environ.get("CHROMA_API_KEY", "ck-4VkTsJANy78AW6spNfLMywoYDNh7R4mkebwYysmZizRh")
CHROMA_TENANT = os.environ.get("CHROMA_TENANT", "9a04c579-4ed1-4f4a-914a-d65b427af626")
CHROMA_DATABASE = os.environ.get("CHROMA_DATABASE", "default_database")
CHROMA_COLLECTION = "krishna_gita_knowledge"

# Gemini embedding model
GEMINI_EMBEDDING_MODEL = "gemini-embedding-001"

_chroma_client: Optional[chromadb.HttpClient] = None
_collection = None


def _get_chroma_client():
    """Lazily initialize ChromaDB Cloud client."""
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.HttpClient(
            ssl=True,
            host="api.trychroma.com",
            tenant=CHROMA_TENANT,
            database=CHROMA_DATABASE,
            headers={"x-chroma-token": CHROMA_API_KEY},
        )
    return _chroma_client


def _get_collection():
    """Get or create the Gita knowledge collection (no embedding fn — we embed manually)."""
    global _collection
    if _collection is None:
        client = _get_chroma_client()
        _collection = client.get_or_create_collection(
            name=CHROMA_COLLECTION,
            metadata={"hnsw:space": "cosine", "description": "Bhagavad Gita shlokas for My Krishna RAG"},
        )
        logger.info(f"ChromaDB collection ready: {CHROMA_COLLECTION} (count={_collection.count()})")
    return _collection


def _embed_with_gemini(texts: List[str]) -> List[List[float]]:
    """Generate embeddings using Google GenAI synchronously."""
    from google import genai
    from google.genai import types as genai_types

    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        raise ValueError("GEMINI_API_KEY not set")

    client = genai.Client(api_key=gemini_key)

    embeddings = []
    batch_size = 10
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        result = client.models.embed_content(
            model=GEMINI_EMBEDDING_MODEL,
            contents=batch,
            config=genai_types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
        )
        embeddings.extend([emb.values for emb in result.embeddings])

    return embeddings


def _embed_query_with_gemini(query: str) -> List[float]:
    """Generate a single query embedding."""
    from google import genai
    from google.genai import types as genai_types

    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        raise ValueError("GEMINI_API_KEY not set")

    client = genai.Client(api_key=gemini_key)

    result = client.models.embed_content(
        model=GEMINI_EMBEDDING_MODEL,
        contents=query,
        config=genai_types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
    )
    return result.embeddings[0].values


def retrieve_relevant_shlokas(query: str, top_k: int = 5) -> List[dict]:
    """
    Retrieve top-k relevant Bhagavad Gita shlokas from ChromaDB for a given query.

    Returns list of dicts with keys: chapter, verse, text, translation, commentary_snippet.
    """
    try:
        collection = _get_collection()

        if collection.count() == 0:
            logger.warning("ChromaDB collection is empty. Run seed_krishna_db.py first.")
            return []

        query_embedding = _embed_query_with_gemini(query)

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, collection.count()),
            include=["documents", "metadatas", "distances"],
        )

        shlokas = []
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        for doc, meta, dist in zip(docs, metas, distances):
            # Only include relevant results (cosine distance < 0.7)
            if dist < 0.7:
                shlokas.append({
                    "chapter": meta.get("chapter"),
                    "verse": meta.get("verse"),
                    "text": meta.get("sanskrit_text", ""),
                    "translation": doc,
                    "commentary_snippet": meta.get("commentary_snippet", ""),
                    "relevance_score": round(1 - dist, 3),
                })

        logger.info(f"Retrieved {len(shlokas)} relevant shlokas for query: '{query[:50]}...'")
        return shlokas

    except Exception as e:
        logger.error(f"ChromaDB retrieval failed: {e}")
        return []


async def retrieve_relevant_shlokas_async(query: str, top_k: int = 5) -> List[dict]:
    """Async wrapper for retrieval."""
    return await asyncio.to_thread(retrieve_relevant_shlokas, query, top_k)


def build_rag_context(shlokas: List[dict]) -> str:
    """Format retrieved shlokas into a context string for the LLM."""
    if not shlokas:
        return ""

    lines = ["[RELEVANT GITA WISDOM — use this to ground your response]\n"]
    for s in shlokas:
        chapter = s.get("chapter", "?")
        verse = s.get("verse", "?")
        translation = s.get("translation", "")
        commentary = s.get("commentary_snippet", "")

        lines.append(f"BG {chapter}.{verse}: {translation}")
        if commentary:
            lines.append(f"  → {commentary[:200]}...")
        lines.append("")

    return "\n".join(lines)


def is_collection_populated() -> bool:
    """Check if the ChromaDB collection has data."""
    try:
        collection = _get_collection()
        return collection.count() > 0
    except Exception as e:
        logger.error(f"ChromaDB health check failed: {e}")
        return False
