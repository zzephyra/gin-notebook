from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Mameos AI Server"
    DEBUG: bool = False

    embedding_model_name: str = "moka-ai/m3e-small"


settings = Settings()