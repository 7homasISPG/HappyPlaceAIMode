import requests
import json

# --- CONFIGURATION ---
BASE_URL = "http://127.0.0.1:8000"

# V V V THIS IS THE LINE TO FIX V V V
# OLD: LOGIN_ENDPOINT = "/api/auth/token" 
# NEW:
LOGIN_ENDPOINT = "/api/auth/login"  # Corrected to match your auth_routes.py

INGEST_ENDPOINT = "/api/ingest-knowledge-base"

# Replace with the credentials of a registered user
TEST_USERNAME = "thomas@gmail.com" # The email you tried before
TEST_PASSWORD = "12345678" # The correct password for thomas@gmail.com
# --- END OF CONFIGURATION ---


def get_auth_token():
    """Authenticates with the API and returns a JWT access token."""
    login_url = f"{BASE_URL}{LOGIN_ENDPOINT}"
    
    login_data = {
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD
    }
    
    print(f"Attempting to log in as '{TEST_USERNAME}' at {login_url}...")
    try:
        response = requests.post(login_url, data=login_data)
        response.raise_for_status() 
        
        token_data = response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            print("❌ ERROR: 'access_token' not found in login response.")
            return None
            
        print("✅ Successfully authenticated. Token received.")
        return access_token
        
    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR during authentication: {e}")
        if 'response' in locals() and response.text:
            print(f"    Server Response: {response.text}")
        return None

# ... (the rest of the script is correct and doesn't need changes) ...

def trigger_ingestion_endpoint(token: str):
    """Calls the knowledge base ingestion endpoint with the provided token."""
    ingest_url = f"{BASE_URL}{INGEST_ENDPOINT}"
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    print(f"\nTriggering ingestion endpoint at {ingest_url}...")
    try:
        response = requests.post(ingest_url, headers=headers)
        response.raise_for_status() # Check for errors
        
        print("✅ SUCCESS! The server responded:")
        print(json.dumps(response.json(), indent=2))
        
    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR calling ingestion endpoint: {e}")
        if 'response' in locals() and response.text:
            print(f"    Server Response: {response.text}")


if __name__ == "__main__":
    auth_token = get_auth_token()
    
    if auth_token:
        trigger_ingestion_endpoint(auth_token)
        print("\nCheck your FastAPI server's console logs to see the background task progress.")