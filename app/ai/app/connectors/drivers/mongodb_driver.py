from pymongo import MongoClient
from app.connectors.types import TestResult, SyncResult, DatasetResult


def _client(secrets: dict) -> MongoClient:
    uri = secrets.get("uri")
    if not uri:
        raise ValueError("Connection URI is required.")
    return MongoClient(uri, serverSelectionTimeoutMS=5000)


def test(config: dict, secrets: dict) -> TestResult:
    if not secrets.get("uri") or not config.get("database"):
        return TestResult(False, "Connection URI and database are required.")
    try:
        client = _client(secrets)
        client.admin.command("ping")
        client.close()
        return TestResult(True, "Connection succeeded.")
    except Exception as e:
        return TestResult(False, f"Couldn't connect: {e}")


def sync(config: dict, secrets: dict) -> SyncResult:
    """Best-effort schema discovery: MongoDB is schemaless, so 'columns' is
    derived from a sample document's top-level keys rather than a real schema."""
    try:
        client = _client(secrets)
        db = client[config["database"]]
        collections = db.list_collection_names()
        datasets = []
        for name in collections:
            coll = db[name]
            row_count = coll.estimated_document_count()
            sample_docs = list(coll.find().limit(5))
            columns = list(sample_docs[0].keys()) if sample_docs else []
            sample_rows = [[str(doc.get(c, "")) for c in columns] for doc in sample_docs]
            datasets.append(DatasetResult(name=name, columns=columns, row_count=row_count, sample_rows=sample_rows))
        client.close()
        return SyncResult(True, f"Discovered {len(datasets)} collection(s).", datasets)
    except Exception as e:
        return SyncResult(False, f"Sync failed: {e}", [])
