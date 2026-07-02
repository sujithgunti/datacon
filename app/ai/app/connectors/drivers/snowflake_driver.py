from app.connectors.types import TestResult, SyncResult, DatasetResult

# snowflake-connector-python is an optional "cloud" extra (see ai/pyproject.toml) —
# real client code, but requires a real Snowflake account to exercise.


def _connect(config: dict, secrets: dict):
    import snowflake.connector

    return snowflake.connector.connect(
        account=config.get("account"),
        user=config.get("username"),
        password=secrets.get("password"),
        warehouse=config.get("warehouse"),
        database=config.get("database"),
        schema=config.get("schema"),
        role=config.get("role") or None,
        login_timeout=8,
    )


def test(config: dict, secrets: dict) -> TestResult:
    required = ["account", "username", "warehouse", "database", "schema"]
    if not all(config.get(k) for k in required) or not secrets.get("password"):
        return TestResult(False, "Account, username, password, warehouse, database and schema are required.")
    try:
        conn = _connect(config, secrets)
        cur = conn.cursor()
        cur.execute("SELECT 1")
        conn.close()
        return TestResult(True, "Connection succeeded.")
    except ImportError:
        return TestResult(False, "snowflake-connector-python isn't installed (pip install '.[cloud]').")
    except Exception as e:
        return TestResult(False, f"Couldn't connect: {e}")


def sync(config: dict, secrets: dict) -> SyncResult:
    try:
        conn = _connect(config, secrets)
        cur = conn.cursor()
        cur.execute(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = %s AND table_type = 'BASE TABLE'",
            (config.get("schema"),),
        )
        tables = [r[0] for r in cur.fetchall()]
        datasets = []
        for table in tables:
            cur.execute(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = %s AND table_name = %s ORDER BY ordinal_position",
                (config.get("schema"), table),
            )
            columns = [r[0] for r in cur.fetchall()]
            cur.execute(f'SELECT COUNT(*) FROM "{table}"')
            row_count = cur.fetchone()[0]
            cur.execute(f'SELECT * FROM "{table}" LIMIT 5')
            sample_rows = [[str(v) for v in row] for row in cur.fetchall()]
            datasets.append(DatasetResult(name=table, columns=columns, row_count=row_count, sample_rows=sample_rows))
        conn.close()
        return SyncResult(True, f"Discovered {len(datasets)} table(s).", datasets)
    except ImportError:
        return SyncResult(False, "snowflake-connector-python isn't installed (pip install '.[cloud]').", [])
    except Exception as e:
        return SyncResult(False, f"Sync failed: {e}", [])
