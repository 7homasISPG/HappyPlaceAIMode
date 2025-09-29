from abc import ABC, abstractmethod

class BaseConnector(ABC):
    @abstractmethod
    def load_data(self, source: str) -> list[dict]:
        """Loads data from a source and returns a list of document dicts."""
        pass