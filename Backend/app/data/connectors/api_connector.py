import requests

class APIConnector:
    """Connector for fetching data from APIs."""
    
    def load_data(self, source: str) -> list[dict]:
        try:
            response = requests.get(source, timeout=15)
            response.raise_for_status()

            data = response.json()  # assume API returns JSON
            documents = []

            # Convert API response into a list of documents
            if isinstance(data, dict):
                documents.append({"text": str(data), "metadata": {"source": source}})
            elif isinstance(data, list):
                for idx, item in enumerate(data):
                    documents.append({"text": str(item), "metadata": {"source": source, "item_id": idx}})
            else:
                documents.append({"text": str(data), "metadata": {"source": source}})

            return documents
        
        except Exception as e:
            print(f"❌ Failed to fetch API source {source}: {e}")
            return []
