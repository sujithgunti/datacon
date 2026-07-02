from anthropic import AsyncAnthropic
from app.config import settings


class AnthropicLLMClient:
    def __init__(self):
        self._client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._model = settings.anthropic_model

    async def compose(self, system: str, prompt: str, offline_text: str) -> str:
        try:
            resp = await self._client.messages.create(
                model=self._model,
                max_tokens=500,
                system=system,
                messages=[{"role": "user", "content": prompt}],
            )
            text = "".join(block.text for block in resp.content if block.type == "text")
            return text or offline_text
        except Exception:
            # A transient provider outage (rate limit, timeout, etc.) shouldn't break the demo.
            return offline_text
