from app.connectors.types import TestResult, SyncResult
from app.connectors.drivers import sqlite_driver, postgres_driver, mysql_driver, mongodb_driver, http_driver, bigquery_driver, snowflake_driver

_DRIVERS = {
    "sqlite": sqlite_driver,
    "postgres": postgres_driver,
    "mysql": mysql_driver,
    "mongodb": mongodb_driver,
    "http": http_driver,
    "bigquery": bigquery_driver,
    "snowflake": snowflake_driver,
}


def test_connection(engine: str, config: dict, secrets: dict) -> TestResult:
    driver = _DRIVERS.get(engine)
    if not driver:
        return TestResult(False, f"Unknown engine: {engine}")
    return driver.test(config, secrets)


def sync_connector(engine: str, config: dict, secrets: dict) -> SyncResult:
    driver = _DRIVERS.get(engine)
    if not driver:
        return SyncResult(False, f"Unknown engine: {engine}", [])
    return driver.sync(config, secrets)
