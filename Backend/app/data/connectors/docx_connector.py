from langchain_community.document_loaders import Docx2txtLoader
from .base_connector import BaseConnector

class DOCXConnector(BaseConnector):
    def load_data(self, file_path: str) -> list[dict]:
        print(f"-> Loading from DOCX: {file_path}")
        loader = Docx2txtLoader(file_path)
        docs = loader.load()
        return [{"source": file_path, "content": doc.page_content} for doc in docs]