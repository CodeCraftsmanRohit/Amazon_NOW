import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # The only external credential the app actually uses today.
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    class Config:
        env_file = ".env"
        extra = "ignore"  # tolerate extra vars in .env without crashing


settings = Settings()
