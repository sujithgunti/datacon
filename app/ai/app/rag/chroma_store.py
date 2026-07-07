"""ChromaDB wrapper for document chunk storage/retrieval. Uses Chroma's
built-in local ONNX MiniLM embedding function so ingestion and retrieval work
fully offline, with zero API keys — per the SRS's embedding choice."""
import chromadb
from chromadb.utils import embedding_functions
from functools import lru_cache
from app.config import settings

_COLLECTION_NAME = "documents"
# Embedding a large single batch spikes RSS far more than the same chunks
# embedded in small groups (measured: one batch of 48 added +236MB vs. +8MB
# for a second batch of 4, after the model's own ~170MB fixed load cost) —
# on Render's free 512MB plan a big PDF's full chunk list in one add() call
# was OOM-killing the service. Batching caps the peak regardless of
# document size.
_EMBED_BATCH_SIZE = 8


@lru_cache(maxsize=1)
def _client():
    return chromadb.PersistentClient(path=settings.chroma_persist_dir)


@lru_cache(maxsize=1)
def _embedder():
    return embedding_functions.DefaultEmbeddingFunction()


@lru_cache(maxsize=1)
def _collection():
    return _client().get_or_create_collection(name=_COLLECTION_NAME, embedding_function=_embedder())


def index_chunks(document_id: str, title: str, filename: str, chunks: list[str]) -> None:
    if not chunks:
        return
    collection = _collection()
    for start in range(0, len(chunks), _EMBED_BATCH_SIZE):
        batch = chunks[start : start + _EMBED_BATCH_SIZE]
        ids = [f"{document_id}::{start + i}" for i in range(len(batch))]
        metadatas = [
            {"document_id": document_id, "title": title, "filename": filename, "chunk_index": start + i} for i in range(len(batch))
        ]
        collection.add(ids=ids, documents=batch, metadatas=metadatas)


def delete_document(document_id: str) -> None:
    _collection().delete(where={"document_id": document_id})


def query(text: str, n_results: int = 3) -> list[dict]:
    collection = _collection()
    if collection.count() == 0:
        return []
    res = collection.query(query_texts=[text], n_results=min(n_results, collection.count()))
    out = []
    for i in range(len(res["ids"][0])):
        out.append(
            {
                "id": res["ids"][0][i],
                "snippet": res["documents"][0][i],
                "metadata": res["metadatas"][0][i],
                "distance": res["distances"][0][i] if res.get("distances") else None,
            }
        )
    return out
