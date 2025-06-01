from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database - Use SQLite for development if PostgreSQL is not available
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./agent_chat.db")
    USE_SQLITE: bool = "sqlite" in os.getenv("DATABASE_URL", "sqlite:///./agent_chat.db")
    
    # Redis (optional for development)
    REDIS_URL: str = "redis://localhost:6379"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Llama API - Get your API key from https://llama.com/
    LLAMA_API_KEY: str = os.getenv("LLAMA_API_KEY", "your-llama-api-key-here")
    
    # Google OAuth - Get credentials from Google Cloud Console
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "your-google-client-id-here")
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET", None)
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"
    
    # App settings
    APP_NAME: str = "Agent Chat"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings() 