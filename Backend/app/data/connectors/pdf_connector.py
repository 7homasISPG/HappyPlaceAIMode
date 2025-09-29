from langchain_community.document_loaders import PyPDFLoader
from .base_connector import BaseConnector

class PDFConnector(BaseConnector):
    def load_data(self, file_path: str) -> list[dict]:
        print(f"-> Loading from PDF: {file_path}")
        loader = PyPDFLoader(file_path)
        pages = loader.load() # loads pages as LangChain Documents
        
        # Convert to our standard dict format
        documents = []
        for page in pages:
            documents.append({
                "source": f"{file_path} (page {page.metadata.get('page', 0) + 1})",
                "content": page.page_content
            })
        return documents