import trafilatura
from .base_connector import BaseConnector

class URLConnector(BaseConnector):
    def load_data(self, url: str) -> list[dict]:
        print(f"-> Loading from URL: {url}")
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            return []
        text = trafilatura.extract(downloaded)
        if text:
            return [{"source": url, "content": text}]
        return []