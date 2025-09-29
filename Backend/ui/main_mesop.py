# --- START OF FILE ui/main_ui.py ---

import mesop as me
import mesop.labs as mel
import requests
from datetime import datetime

# Define the FastAPI backend URL.
# If you are running both Mesop and FastAPI locally, this will be the URL for your FastAPI server.
FASTAPI_BACKEND_URL = "http://127.0.0.1:8000/api/ask"

@me.page(
    path="/",
    title="ISPG Q&A Assistant"
)
def page():
    """Defines the main chat page UI and logic."""
    mel.chat(
        transform,
        title="ISPG Q&A Assistant"
    )

def transform(user_query: str, history: list[mel.ChatMessage]):
    """
    This function is called when a user sends a message.
    It sends the query to the FastAPI backend and yields the response.
    """
    # 1. Add the user's message to the chat history immediately
    history.append(mel.ChatMessage(role="user", content=user_query))

    # 2. Prepare the request payload for the FastAPI backend
    payload = {"query": user_query}
    
    # 3. Show a thinking indicator while waiting for the response
    yield "Thinking..."

    # 4. Make the request to the backend
    try:
        response = requests.post(FASTAPI_BACKEND_URL, json=payload, timeout=60)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)

        data = response.json()
        answer = data.get("answer", "Sorry, I couldn't get an answer.")
        sources = data.get("source_documents", [])

        # Format the response with the answer and sources
        formatted_response = f"{answer}\n\n"
        if sources:
            # Create a markdown list of unique sources
            unique_sources = sorted(list(set(sources)))
            formatted_response += "**Sources:**\n"
            for source in unique_sources:
                formatted_response += f"- {source}\n"
        
        yield formatted_response

    except requests.exceptions.RequestException as e:
        # Handle network errors or non-200 responses
        print(f"Error calling backend: {e}")
        yield "Sorry, there was an error connecting to the assistant. Please try again later."
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        yield "An unexpected error occurred. Please check the logs."

# Note: This file is intended to be run with the `mesop` command.
# For example: `mesop ui/main_ui.py`