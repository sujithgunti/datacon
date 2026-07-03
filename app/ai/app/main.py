from fastapi import FastAPI

from app.config import settings
from app.internal.connectors_router import router as connectors_router
from app.internal.documents_router import router as documents_router
from app.internal.chat_router import router as chat_router
from app.internal.forecast_router import router as forecast_router

app = FastAPI(title="Datacon AI Service")
app.include_router(connectors_router)
app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(forecast_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai", "llm_configured": bool(settings.gemini_api_key)}
