from unstructured.partition.image import partition_image
from .base_connector import BaseConnector

class ImageConnector(BaseConnector):
    def load_data(self, file_path: str) -> list[dict]:
        """
        Extracts text from an image using OCR. This is a basic approach.
        A more advanced approach would use a multimodal model to generate a
        rich description.
        """
        print(f"-> Loading from Image (OCR): {file_path}")
        try:
            elements = partition_image(filename=file_path)
            content = "\n\n".join([str(el) for el in elements])
            return [{"source": file_path, "content": f"Image content: {content}"}]
        except Exception as e:
            print(f"Could not process image {file_path} with unstructured. Error: {e}")
            return []