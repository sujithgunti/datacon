"""Document text extraction + chunking, per the SRS: PDF/TXT/MD are split into
overlapping word chunks (480 words, 60 overlap) before vector indexing; CSVs
are loaded into a dataframe instead (they feed the Descriptive agent directly,
not the RAG pipeline)."""
import pandas as pd
from pypdf import PdfReader

CHUNK_SIZE_WORDS = 480
CHUNK_OVERLAP_WORDS = 60


def extract_pdf_text(path: str) -> str:
    reader = PdfReader(path)
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def extract_text_file(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def chunk_words(text: str, size: int = CHUNK_SIZE_WORDS, overlap: int = CHUNK_OVERLAP_WORDS) -> list[str]:
    words = text.split()
    if not words:
        return []
    step = max(size - overlap, 1)
    chunks = []
    for start in range(0, len(words), step):
        chunk = words[start : start + size]
        if not chunk:
            break
        chunks.append(" ".join(chunk))
        if start + size >= len(words):
            break
    return chunks


def parse_csv(path: str) -> tuple[list[str], int]:
    df = pd.read_csv(path)
    return [str(c) for c in df.columns], len(df)
