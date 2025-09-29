import sqlite3
from datetime import datetime
from app.config import settings
import os

# Ensure the logs directory exists
os.makedirs(os.path.dirname(settings.LOG_DB_PATH), exist_ok=True)

def init_log_db():
    conn = sqlite3.connect(settings.LOG_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS query_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        query TEXT,
        answer TEXT,
        lang TEXT
    )
    """)
    conn.commit()
    conn.close()

def log_query(query: str, answer: str, lang: str):
    conn = sqlite3.connect(settings.LOG_DB_PATH)
    cursor = conn.cursor()
    timestamp = datetime.utcnow().isoformat()
    cursor.execute("INSERT INTO query_logs (timestamp, query, answer, lang) VALUES (?, ?, ?, ?)",
                   (timestamp, query, answer, lang))
    conn.commit()
    conn.close()

# Run on import
init_log_db()
