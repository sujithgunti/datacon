import json
from app.connectors.types import TestResult, SyncResult, DatasetResult

# google-cloud-bigquery is an optional "cloud" extra (see ai/pyproject.toml) —
# real client code, but requires a real GCP service account to exercise.


def _client(config: dict, secrets: dict):
    from google.cloud import bigquery
    from google.oauth2 import service_account

    key_json = secrets.get("serviceAccountJson")
    if not key_json:
        raise ValueError("Service-account JSON is required.")
    info = json.loads(key_json)
    creds = service_account.Credentials.from_service_account_info(info)
    return bigquery.Client(project=config.get("projectId"), credentials=creds, location=config.get("location") or "US")


def test(config: dict, secrets: dict) -> TestResult:
    if not config.get("projectId") or not config.get("dataset") or not secrets.get("serviceAccountJson"):
        return TestResult(False, "GCP project ID, dataset and service-account JSON are required.")
    try:
        client = _client(config, secrets)
        list(client.query("SELECT 1").result())
        return TestResult(True, "Connection succeeded.")
    except ImportError:
        return TestResult(False, "google-cloud-bigquery isn't installed (pip install '.[cloud]').")
    except Exception as e:
        return TestResult(False, f"Couldn't connect: {e}")


def sync(config: dict, secrets: dict) -> SyncResult:
    try:
        client = _client(config, secrets)
        dataset_ref = client.dataset(config["dataset"])
        tables = list(client.list_tables(dataset_ref))
        datasets = []
        for t in tables:
            table = client.get_table(t.reference)
            columns = [f.name for f in table.schema]
            rows = client.list_rows(table, max_results=5)
            sample_rows = [[str(v) for v in row.values()] for row in rows]
            datasets.append(DatasetResult(name=t.table_id, columns=columns, row_count=table.num_rows or 0, sample_rows=sample_rows))
        return SyncResult(True, f"Discovered {len(datasets)} table(s).", datasets)
    except ImportError:
        return SyncResult(False, "google-cloud-bigquery isn't installed (pip install '.[cloud]').", [])
    except Exception as e:
        return SyncResult(False, f"Sync failed: {e}", [])
