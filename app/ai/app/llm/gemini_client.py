from google import genai
from google.genai import types
from app.config import settings


class GeminiLLMClient:
    def __init__(self):
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._model = settings.gemini_model

    async def compose(self, system: str, prompt: str, offline_text: str) -> str:
        try:
            resp = await self._client.aio.models.generate_content(
                model=self._model,
                contents=prompt,
                config=types.GenerateContentConfig(system_instruction=system, max_output_tokens=500),
            )
            return resp.text or offline_text
        except Exception:
            # A transient provider outage (rate limit, timeout, etc.) shouldn't break the demo.
            return offline_text
