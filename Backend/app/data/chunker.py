# --- START OF FILE app/data/chunker.py (Corrected) ---

from langchain.text_splitter import RecursiveCharacterTextSplitter

def chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    # Handle cases where the text might be None or not a string
    if not isinstance(text, str):
        return []
    return splitter.split_text(text)

def chunk_documents(docs: list[dict]) -> list[dict]:
    """Split each document into chunks with metadata."""
    chunks = []
    for doc in docs:
        # Ensure 'content' exists and is not None before chunking
        content = doc.get("content")
        if not content:
            continue

        text_chunks = chunk_text(content)
        for i, chunk in enumerate(text_chunks):
            chunks.append({
                "text": chunk,
                "metadata": {
                    # --- THIS IS THE FIX ---
                    # Use doc["source"] instead of doc["url"]
                    "source": doc["source"],
                    "chunk_id": i
                }
            })
    return chunks