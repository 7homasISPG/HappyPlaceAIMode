# --- START OF FILE app/db/database.py ---

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

db = {} # Global dictionary to hold the database client and instance

async def connect_to_mongo():
    print("--- Connecting to MongoDB ---")
    # Ensure TLS/SSL is enabled for Atlas or remote MongoDB
    db["client"] = AsyncIOMotorClient(settings.MONGO_URI, tls=True, tlsAllowInvalidCertificates=True)
    db["database"] = db["client"][settings.MONGO_DB_NAME]
    print(f"--- MongoDB connection to '{settings.MONGO_DB_NAME}' successful ---")

async def close_mongo_connection():
    print("--- Closing MongoDB connection ---")
    db["client"].close()

def get_database():
    """FastAPI dependency to get the database instance."""
    return db["database"]