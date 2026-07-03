# Datacon

Full-stack implementation of the Datacon prototype (`../project/Datacon.dc.html`) per the PRD/SRS in `../project/uploads/`. See `/root/.claude/plans/staged-exploring-lemur.md` (or ask Claude) for the full architecture plan and phased build order.

## Stack

- `web/` — React 19 + TypeScript + Vite
- `api/` — NestJS: auth, RBAC, connector/document metadata CRUD, insights, SSE proxy
- `ai/` — FastAPI (Python): multi-agent chat, RAG (ChromaDB), forecasting, connector drivers
- `packages/prisma/` — Prisma schema/migrations + the connector-engines field registry + seed script
- `packages/shared-types/` — TS types shared between `web` and `api`

## First-time setup

1. **Database**: either
   - create a [Supabase](https://supabase.com) project and copy its Postgres connection string into `DATABASE_URL` in `.env`, **or**
   - run Postgres locally (`docker compose up -d app_postgres`, or a native `postgresql` install) and point `DATABASE_URL` at it.
2. `cp .env.example .env` and fill in secrets (`CONNECTOR_ENCRYPTION_KEY` — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`).
3. `npm install` (installs all workspaces).
4. `npm run prisma:migrate` then `npm run prisma:seed` — seeds the exact demo dataset from the prototype (3 personas + 1 extra user, 3 system roles, 7 permissions, 4 connectors, 6 catalog tables, 5 documents). **Seed login password for every persona: `Datacon123!`**
5. `ai/`: `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`, then `python3 seed_chroma.py` once to index the two seed documents the Diagnostic agent cites.
6. `npm run dev` boots `api` (port 4000), `ai` (port 8000), and `web` (port 5173) together.

## What's implemented

- **Auth & RBAC** — double-JWT cookie auth, custom roles/permissions, Users/Roles/Assign-roles/Permissions admin pages.
- **Connectors** — all 7 engine types with real drivers (SQLite/Postgres/MySQL/HTTP fully live; MongoDB/BigQuery/Snowflake real code, need external creds/instances to exercise), AES-256-GCM secret encryption, Unified Data Store catalog with table previews.
- **Data Sources** — real upload → chunk/embed → ChromaDB indexing pipeline (PDF/TXT/MD) or column/row parsing (CSV), with the exact validation messages from the design.
- **Chat** — real intent routing, 4 agents (descriptive/diagnostic/predictive/prescriptive) computing over real seeded business data + real RAG citations, SSE token streaming, feedback.
- **Forecasts** — real OLS and Holt-Winters implementations (pure NumPy) over an 18-month revenue series, with live model/horizon controls.
- **Insights dashboard** — KPIs, anomalies, and the revenue chart all computed from the same real data, with a deep-link into Chat.
- **Themes** — 4 presets + custom accent picker, cascades via CSS custom properties, persists per-browser.

## Note on Docker-based local infra

`docker-compose.yml` defines local Postgres/MySQL/MongoDB (sample external data sources for the connector engines) and ChromaDB. In sandboxed dev environments without Docker Hub egress, install these natively instead (e.g. `apt install postgresql`) or point the relevant connector at a real hosted instance — the app itself has no hard dependency on Docker.

## LLM configuration

Chat works with **zero API keys** out of the box (deterministic offline responses computed over real retrieved/synced data). The chat agents route through [LiteLLM](https://docs.litellm.ai/) (per the SRS's "LLM Orchestrator" spec) rather than calling a provider SDK directly, so the active model is a single `LLM_MODEL` string in `.env` (default: `gemini/gemma-4-31b-it`) — set `GEMINI_API_KEY` to enable it. Switching providers/models later (e.g. `anthropic/claude-...` + `ANTHROPIC_API_KEY`) is a config change, not a code change. Note: Gemma's `-it` models are reasoning models that spend part of their token budget on internal "thinking" before the visible answer, and have shown occasional transient `500` errors from Google's backend — `LiteLLMClient` retries once and falls back to the offline template if both attempts fail.
