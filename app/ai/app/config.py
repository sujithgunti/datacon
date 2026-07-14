from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = ""
    chroma_url: str = "http://localhost:8001"
    chroma_persist_dir: str = "./.chroma"
    query_engine_db_path: str = "./data/snapshot.duckdb"
    # LiteLLM orchestrates the provider call from a single "provider/model"
    # string (SRS §2.2), so swapping providers is a config change, not a
    # code change — e.g. "anthropic/claude-..." + ANTHROPIC_API_KEY would
    # work too. GEMINI_API_KEY is what LiteLLM itself reads for anything
    # prefixed "gemini/".
    gemini_api_key: str | None = None
    llm_model: str = "gemini/gemma-4-31b-it"
    internal_auth_token: str = "dev-internal-token"


settings = Settings()
