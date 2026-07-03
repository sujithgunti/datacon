class OfflineLLMClient:
    """Zero-secrets fallback: the deterministic paragraph passed in was already
    built from real retrieved/computed data by the calling agent — this client
    just returns it, so chat is fully usable with no GEMINI_API_KEY set."""

    async def compose(self, system: str, prompt: str, offline_text: str) -> str:
        return offline_text
