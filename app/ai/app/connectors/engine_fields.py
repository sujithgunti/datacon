"""Loads the single source-of-truth connector engine field registry, shared
with the NestJS API and the React frontend (packages/shared-types/src/connector-engines.json),
so the AI service never maintains its own divergent copy of "what fields does Snowflake need."
"""
import json
from pathlib import Path
from functools import lru_cache

_REGISTRY_PATH = Path(__file__).resolve().parents[3] / "packages" / "shared-types" / "src" / "connector-engines.json"


@lru_cache(maxsize=1)
def load_registry() -> dict:
    with open(_REGISTRY_PATH, "r") as f:
        return json.load(f)


def engine_def(engine: str) -> dict:
    registry = load_registry()
    if engine not in registry:
        raise KeyError(f"Unknown connector engine: {engine}")
    return registry[engine]


def secret_keys(engine: str) -> set[str]:
    d = engine_def(engine)
    keys = set()
    if d["primary"].get("secret"):
        keys.add(d["primary"]["key"])
    for f in d["secondary"]:
        if f.get("secret"):
            keys.add(f["key"])
    return keys
