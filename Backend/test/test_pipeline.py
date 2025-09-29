# --- START OF FILE test_pipeline.py ---

import pytest
from app.rag.pipeline import get_rag_answer  # Corrected function name

# This is an integration test and requires API keys to be set.
# Mark it to avoid running on CI without secrets.
@pytest.mark.integration
def test_get_rag_answer_basic():
    # Arrange
    # Ensure your .env file is loaded and you have run usage.py
    # so the vector store has content.
    query = "What is ISPG?"
    
    # Act
    answer, sources = get_rag_answer(query, lang="en")
    
    # Assert
    assert isinstance(answer, str)
    assert len(answer) > 0
    assert isinstance(sources, list)
    # You might assert more specific things if you know the content
    # For example, assert "ispg.co" in sources[0]