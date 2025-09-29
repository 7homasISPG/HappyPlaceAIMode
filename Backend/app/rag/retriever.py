# --- START OF FILE app/rag/retriever.py (Corrected) ---

from app.config import settings
from pinecone import Pinecone, ServerlessSpec
from langchain_community.vectorstores import Pinecone as LangchainPinecone
from langchain_openai import OpenAIEmbeddings

# Use a global variable to hold the vector_store instance (Singleton pattern)
_vector_store = None

def _initialize_vector_store():
    """
    Private function to initialize the vector store connection.
    This function will only be called once.
    """
    global _vector_store
    
    print("--- Initializing Pinecone Vector Store ---")
    
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    index_name = settings.PINECONE_INDEX_NAME
    
    embedding_model = OpenAIEmbeddings(
        model=settings.EMBEDDING_MODEL_NAME,
        openai_api_key=settings.OPENAI_API_KEY
    )

    if index_name not in pc.list_indexes().names():
        print(f"Index '{index_name}' not found. Creating a new SERVERLESS index...")
        pc.create_index(
            name=index_name,
            dimension=settings.EMBEDDING_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
    
    _vector_store = LangchainPinecone.from_existing_index(
        index_name=index_name,
        embedding=embedding_model
    )
    print("--- Pinecone Vector Store Initialized ---")

def get_vector_store():
    """
    Returns the global vector store instance.
    Initializes it on the first call.
    """
    if _vector_store is None:
        _initialize_vector_store()
    return _vector_store

def get_retriever(search_k: int = 4):
    """
    Returns a retriever instance from the global vector store.
    """
    vs = get_vector_store()
    return vs.as_retriever(search_kwargs={'k': search_k})