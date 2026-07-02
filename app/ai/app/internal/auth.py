from fastapi import Header, HTTPException
from app.config import settings


async def require_internal_auth(x_internal_auth: str | None = Header(default=None)):
    """Guards /internal/* routes — only the NestJS API (which holds the shared
    token) may call these; they are never exposed to the public frontend."""
    if x_internal_auth != settings.internal_auth_token:
        raise HTTPException(status_code=401, detail="Missing or invalid internal auth token.")
