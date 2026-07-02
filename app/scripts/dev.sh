#!/usr/bin/env bash
# Boots the NestJS API, the FastAPI AI service, and the Vite dev server together.
set -euo pipefail
cd "$(dirname "$0")/.."

npx concurrently -n api,ai,web -c blue,green,magenta \
  "npm run start:dev --workspace=api" \
  "cd ai && (test -d .venv && source .venv/bin/activate; uvicorn app.main:app --reload --port 8000)" \
  "npm run dev --workspace=web"
