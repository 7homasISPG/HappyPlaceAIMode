# --- START OF FILE app/data/data_ingestion_pipeline.py ---

# This module orchestrates the entire data ingestion process.

# 1. Import the sources and loaders
from app.data.usage import SOURCES, load_from_source

# 2. Import the processing components
from app.data.chunker import chunk_documents
from app.data.embedder import embed_and_store_chunks

def run_ingestion_pipeline():
    """
    Executes the full data ingestion pipeline.
    
    1. Iterates through all predefined SOURCES.
    2. Loads data using the appropriate connector via load_from_source.
    3. Chunks the loaded documents.
    4. Generates embeddings and stores them in the vector database.
    
    This function is designed to be run as a background task.
    """
    print("--- [Background Task] Starting knowledge base ingestion pipeline ---")
    total_sources = len(SOURCES)
    successful_sources = 0
    failed_sources = 0
    total_chunks_added = 0

    # Loop through each defined source
    for i, source in enumerate(SOURCES):
        try:
            print(f"--- [Pipeline {i+1}/{total_sources}] Processing source: {source} ---")
            
            # Load documents from the source
            docs = load_from_source(source)
            if not docs:
                print(f"--- [Pipeline Warning] No documents returned from source: {source} ---")
                failed_sources += 1
                continue
            
            # Chunk the documents
            chunks = chunk_documents(docs)
            if not chunks:
                print(f"--- [Pipeline Warning] No chunks were created from source: {source} ---")
                failed_sources += 1
                continue

            # Embed and store the chunks
            embed_and_store_chunks(chunks)
            
            successful_sources += 1
            num_chunks = len(chunks)
            total_chunks_added += num_chunks
            print(f"--- [Pipeline Success] Processed '{source}'. Added {num_chunks} chunks. ---")

        except Exception as e:
            # Log any errors and continue to the next source
            print(f"--- [Pipeline ERROR] Failed to process source '{source}': {e} ---")
            failed_sources += 1

    print("--- [Background Task] Knowledge base ingestion pipeline finished ---")
    print("--- ================= INGESTION SUMMARY ================= ---")
    print(f"    - Successfully processed sources: {successful_sources}/{total_sources}")
    print(f"    - Failed sources:                 {failed_sources}")
    print(f"    - Total chunks added to DB:       {total_chunks_added}")
    print("--- ===================================================== ---")