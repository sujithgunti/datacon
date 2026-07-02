import io
import httpx
import pandas as pd
from app.connectors.types import TestResult, SyncResult, DatasetResult


def _headers(secrets: dict) -> dict:
    auth = secrets.get("authHeader")
    return {"Authorization": auth} if auth else {}


def _detect_format(config: dict) -> str:
    fmt = (config.get("format") or "auto").lower()
    if fmt != "auto":
        return fmt
    url = (config.get("url") or "").lower()
    return "parquet" if url.endswith(".parquet") else "csv"


def test(config: dict, secrets: dict) -> TestResult:
    url = config.get("url")
    if not url:
        return TestResult(False, "File URL is required.")
    try:
        resp = httpx.get(url, headers=_headers(secrets), timeout=8, follow_redirects=True)
        if resp.status_code != 200:
            return TestResult(False, f"Server responded with {resp.status_code}.")
        return TestResult(True, "Connection succeeded.")
    except Exception as e:
        return TestResult(False, f"Couldn't fetch URL: {e}")


def sync(config: dict, secrets: dict) -> SyncResult:
    url = config.get("url")
    dataset_name = config.get("datasetName") or "dataset"
    try:
        resp = httpx.get(url, headers=_headers(secrets), timeout=20, follow_redirects=True)
        resp.raise_for_status()
        fmt = _detect_format(config)
        buf = io.BytesIO(resp.content)
        df = pd.read_parquet(buf) if fmt == "parquet" else pd.read_csv(buf)
        columns = [str(c) for c in df.columns]
        row_count = len(df)
        sample_rows = df.head(5).astype(str).values.tolist()
        dataset = DatasetResult(name=dataset_name, columns=columns, row_count=row_count, sample_rows=sample_rows)
        return SyncResult(True, f"Fetched {row_count} rows.", [dataset])
    except Exception as e:
        return SyncResult(False, f"Sync failed: {e}", [])
