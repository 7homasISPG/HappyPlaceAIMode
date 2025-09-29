# --- START OF FILE app/data/usage.py (Modified) ---

import os
from app.data.chunker import chunk_documents
from app.data.embedder import embed_and_store_chunks

# Import all your connectors
from app.data.connectors.url_connector import URLConnector
from app.data.connectors.pdf_connector import PDFConnector
from app.data.connectors.docx_connector import DOCXConnector
from app.data.connectors.image_connector import ImageConnector
from app.data.connectors.api_connector import APIConnector   # ✅ NEW

# Define the location of your local files
KNOWLEDGE_BASE_DIR = "Knowledge_Base"

# A list of all sources to ingest
SOURCES = [
    # URLs
    "https://www.firstdrivingcentre.ae/en/car-driving-course",
    "https://www.firstdrivingcentre.ae/en/limousine-training-course",
    "https://www.firstdrivingcentre.ae/en/about-us",
    "https://www.firstdrivingcentre.ae/en/road-safety",
    "https://www.firstdrivingcentre.ae/en/traffic-sign",
    "https://www.firstdrivingcentre.ae/en/careers",
    "https://www.firstdrivingcentre.ae/en/taxi-driving-course",

    # API Example
    "api:https://jsonplaceholder.typicode.com/posts",   # ✅ Mark APIs with "api:" prefix

    # Local files (commented out here)
    #os.path.join(KNOWLEDGE_BASE_DIR, "sample.pdf"),
    #os.path.join(KNOWLEDGE_BASE_DIR, "info.docx"),
    #os.path.join(KNOWLEDGE_BASE_DIR, "product_image.png")
]

def load_from_source(source: str) -> list[dict]:
    """Detects the source type and uses the appropriate connector."""
    if source.startswith("api:"):
        connector = APIConnector()
        return connector.load_data(source.replace("api:", "", 1))
    elif source.startswith("http://") or source.startswith("https://"):
        connector = URLConnector()
    elif source.lower().endswith(".pdf"):
        connector = PDFConnector()
    elif source.lower().endswith(".docx"):
        connector = DOCXConnector()
    elif source.lower().endswith((".png", ".jpg", ".jpeg")):
        connector = ImageConnector()
    else:
        print(f"⚠️ Warning: No connector found for source: {source}. Skipping.")
        return []
    
    return connector.load_data(source)
