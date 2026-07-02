"""ChromaDB wrapper for document chunk storage/retrieval. Uses Chroma's
built-in local ONNX MiniLM embedding function so ingestion and retrieval work
fully offline, with zero API keys — per the SRS's embedding choice."""
import chromadb
from chromadb.utils import embedding_functions
from functools import lru_cache
from app.config import settings

_COLLECTION_NAME = "documents"


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
    ids = [f"{document_id}::{i}" for i in range(len(chunks))]
    metadatas = [{"document_id": document_id, "title": title, "filename": filename, "chunk_index": i} for i in range(len(chunks))]
    collection.add(ids=ids, documents=chunks, metadatas=metadatas)


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
