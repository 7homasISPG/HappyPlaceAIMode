
from app.rag.retriever import get_vector_store
from langchain.docstore.document import Document

def embed_and_store_chunks(chunks: list[dict]):
    """
    Embeds document chunks and stores them in the vector store.
    
    Args:
        chunks (list[dict]): A list of dictionaries, where each dict
                               contains 'text' and 'metadata'.
    """
    vectorstore = get_vector_store()

    # Convert dicts to LangChain Document objects
    documents = [
        Document(page_content=chunk["text"], metadata=chunk["metadata"])
        for chunk in chunks
    ]
    
    vectorstore.add_documents(documents)
    print(f"Successfully added {len(documents)} chunks to the vector store.")
