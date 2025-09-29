import streamlit as st
import requests
import time

# --- Page Configuration ---
st.set_page_config(
    page_title="ISPG Q&A Assistant",
    page_icon="🤖",
    layout="wide"
)

# --- Backend Configuration ---
FASTAPI_BACKEND_URL_ASK = "http://127.0.0.1:8000/api/ask"
FASTAPI_BACKEND_URL_UPLOAD = "http://127.0.0.1:8000/api/upload"

# =================================================================
# --- SIDEBAR FOR KNOWLEDGE BASE MANAGEMENT ---
# =================================================================
with st.sidebar:
    st.header("Knowledge Base Management")
    
    st.subheader("Upload a Document")
    uploaded_file = st.file_uploader(
        "Choose a file (PDF, DOCX)",
        type=["pdf", "docx", "png", "jpg", "jpeg"]
    )
    
    if uploaded_file is not None:
        # Display a button to trigger the upload and ingestion
        if st.button("Add to Knowledge Base"):
            with st.spinner(f"Processing '{uploaded_file.name}'... Please wait."):
                try:
                    # Prepare the file for the POST request
                    files = {"file": (uploaded_file.name, uploaded_file, uploaded_file.type)}
                    
                    # Send the file to the FastAPI backend
                    response = requests.post(FASTAPI_BACKEND_URL_UPLOAD, files=files, timeout=300) # Increased timeout for large files
                    
                    if response.status_code == 200:
                        st.success(f"✅ Success! {response.json().get('message', '')}")
                    else:
                        # Show the error message from the backend
                        error_detail = response.json().get('detail', 'Unknown error occurred.')
                        st.error(f"❌ Error: {error_detail}")

                except requests.exceptions.RequestException as e:
                    st.error(f"Connection Error: Could not connect to the backend. Details: {e}")
                except Exception as e:
                    st.error(f"An unexpected error occurred: {e}")

    st.divider()
    st.info("Note: Uploaded documents will be available for questions in the chat immediately after successful processing.")


# =================================================================
# --- MAIN CHAT INTERFACE ---
# =================================================================
st.title("ISPG Q&A Assistant 🤖")
st.caption("Your intelligent assistant for all questions about ISPG.")

# --- Session State Initialization ---
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": "Hello! How can I help you? You can also upload new documents from the sidebar."}
    ]

# --- Display Chat History ---
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# --- Handle User Input ---
if prompt := st.chat_input("What would you like to know?"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # --- Get Assistant Response ---
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        full_response = ""
        message_placeholder.markdown("Thinking...")
        
        try:
            payload = {"query": prompt}
            response = requests.post(FASTAPI_BACKEND_URL_ASK, json=payload, timeout=60)
            response.raise_for_status()
            
            data = response.json()
            answer = data.get("answer", "Sorry, I couldn't get a valid answer.")
            sources = data.get("source_documents", [])

            full_response = f"{answer}\n\n"
            if sources:
                unique_sources = sorted(list(set(sources)))
                full_response += "**Sources:**\n"
                for source in unique_sources:
                    full_response += f"- {source}\n"
            
            message_placeholder.markdown(full_response)

        except Exception as e:
            full_response = f"An error occurred: {e}"
            message_placeholder.error(full_response)
            
    st.session_state.messages.append({"role": "assistant", "content": full_response})