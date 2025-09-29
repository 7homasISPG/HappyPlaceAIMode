import requests
import json
import uuid # To create unique names for testing

# --- CONFIGURATION ---
# Fill in these details for your application
BASE_URL = "http://localhost:8000"
LOGIN_ENDPOINT = "/api/auth/login"
AGENTS_ENDPOINT = "/api/agents" # The base endpoint for your new routes

# Replace with the credentials of a registered user
TEST_USERNAME = "thomas@gmail.com"
TEST_PASSWORD = "12345678"
# --- END OF CONFIGURATION ---


def get_auth_token():
    """Authenticates with the API and returns a JWT access token."""
    login_url = f"{BASE_URL}{LOGIN_ENDPOINT}"
    login_data = {"username": TEST_USERNAME, "password": TEST_PASSWORD}
    
    print(f"--- 1. AUTHENTICATING as '{TEST_USERNAME}' ---")
    try:
        response = requests.post(login_url, data=login_data)
        response.raise_for_status() 
        token_data = response.json()
        access_token = token_data.get("access_token")
        if not access_token:
            print("❌ ERROR: 'access_token' not found in login response.")
            return None
        print("✅ Authentication successful.")
        return access_token
    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR during authentication: {e}")
        if 'response' in locals() and response.text:
            print(f"    Server Response: {response.text}")
        return None


def test_get_agents(token: str, step_number: int):
    """Fetches and prints all agents for the current user."""
    get_url = f"{BASE_URL}{AGENTS_ENDPOINT}"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n--- {step_number}. GETTING all agents ---")
    try:
        response = requests.get(get_url, headers=headers)
        response.raise_for_status()
        agents = response.json()
        
        if not isinstance(agents, list):
            print(f"❌ ERROR: Expected a list of agents, but got type {type(agents)}")
            return None

        print(f"✅ Found {len(agents)} agent(s).")
        for agent in agents:
            # Note: The ID from MongoDB is typically in the '_id' field
            agent_id = agent.get('_id') or agent.get('id')
            print(f"   - ID: {agent_id}, Name: {agent.get('name')}")
        return agents
        
    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR getting agents: {e}")
        if 'response' in locals() and response.text:
            print(f"    Server Response: {response.text}")
        return None

def test_create_agent(token: str, step_number: int):
    """Creates a new agent."""
    create_url = f"{BASE_URL}{AGENTS_ENDPOINT}"
    headers = {"Authorization": f"Bearer {token}"}
    
    # This payload must match your `AgentSpec` Pydantic model
    unique_name = f"Test Agent {uuid.uuid4().hex[:6]}"
    agent_payload = {
        "name": unique_name,
        "system_message": "You are a test agent created by an automated script.",
        "tasks": [
            {
                "name": "get_weather",
                "description": "Find the weather in a city",
                "endpoint": "/api/weather",
                "params_schema": {
                    "type": "object",
                    "properties": {"city": {"type": "string"}},
                    "required": ["city"]
                }
            }
        ]
    }
    
    print(f"\n--- {step_number}. CREATING new agent named '{unique_name}' ---")
    try:
        response = requests.post(create_url, headers=headers, json=agent_payload)
        
        if response.status_code != 201:
            print(f"❌ ERROR: Expected status code 201 Created, but got {response.status_code}")
            print(f"    Server Response: {response.text}")
            return False

        response.raise_for_status() # Check for other errors
        created_agent = response.json()
        
        print(f"✅ Agent created successfully! New Agent ID: {created_agent.get('_id')}")
        # Verify the name matches
        assert created_agent.get("name") == unique_name
        return True

    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR creating agent: {e}")
        if 'response' in locals() and response.text:
            print(f"    Server Response: {response.text}")
        return False


if __name__ == "__main__":
    # 1. Get auth token
    auth_token = get_auth_token()
    
    if auth_token:
        # 2. Get initial list of agents
        initial_agents = test_get_agents(auth_token, step_number=2)
        
        if initial_agents is not None:
            initial_count = len(initial_agents)
            
            # 3. Create a new agent
            success = test_create_agent(auth_token, step_number=3)
            
            if success:
                # 4. Get the list of agents again to verify creation
                final_agents = test_get_agents(auth_token, step_number=4)
                
                if final_agents is not None:
                    final_count = len(final_agents)
                    print("\n--- 5. FINAL VERIFICATION ---")
                    if final_count == initial_count + 1:
                        print(f"✅ SUCCESS: Agent count increased from {initial_count} to {final_count}.")
                    else:
                        print(f"❌ FAILED: Agent count did not increase correctly. Expected {initial_count + 1}, but found {final_count}.")