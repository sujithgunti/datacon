from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = ""
    chroma_url: str = "http://localhost:8001"
    chroma_persist_dir: str = "./.chroma"
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-5"
    internal_auth_token: str = "dev-internal-token"


settings = Settings()
