# --- START OF FILE app/state.py ---
import asyncio

# Queue for receiving user input from the frontend WebSocket
frontend_input_queue = asyncio.Queue()

# Queue for sending agent output to the frontend WebSocket
backend_output_queue = asyncio.Queue()

# --- THIS IS THE FIX ---
# A shared dictionary to hold synchronization events for each session.
# This allows the WebSocket endpoint to signal to the waiting AutoGen task
# that the connection is ready.
# Key: session_id (str), Value: asyncio.Event
SESSION_EVENTS = {}
# --- END OF FIX ---