
import os
from dotenv import load_dotenv

load_dotenv()  # Load from .env file if present

class Settings:
    # OpenAI or other LLM provider
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LLM_MODEL_NAME: str = os.getenv("LLM_MODEL_NAME", "gpt-3.5-turbo")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    
    # Embedding model
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "text-embedding-3-small")
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "1536")) # 1536 for small, 3072 for large

    # Vector DB config (Pinecone)
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_ENV: str = os.getenv("PINECONE_ENV", "")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "ispg-rag-index")
    
    # Multilingual support
    ENABLE_TRANSLATION: bool = os.getenv("ENABLE_TRANSLATION", "true").lower() == "true"
    
    # Logging config
    LOG_DB_PATH: str = os.getenv("LOG_DB_PATH", "logs/queries.db")

    # --- Primary Database (MongoDB) ---
    MONGO_URI: str = os.getenv("MONGO_URI")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "aimodeagents")

    # --- Authentication (JWT) ---
    SECRET_KEY: str = os.getenv("SECRET_KEY") # A long, random string for signing JWTs
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Supported languages
    SUPPORTED_LANGUAGES = ["en", "ar"]

settings = Settings()