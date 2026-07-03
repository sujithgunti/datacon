from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = ""
    chroma_url: str = "http://localhost:8001"
    chroma_persist_dir: str = "./.chroma"
    gemini_api_key: str | None = None
    gemini_model: str = "gemma-4-31b-it"
    internal_auth_token: str = "dev-internal-token"


settings = Settings()
