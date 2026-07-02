from dataclasses import dataclass
from typing import Any


@dataclass
class AgentResult:
    text: str
    payload: dict[str, Any]
