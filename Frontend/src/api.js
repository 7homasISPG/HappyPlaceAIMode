// src/api.js
import axios from 'axios';

// Get the base URL from Vite's environment variables, with a fallback for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Helper to get the auth token from localStorage
const getToken = () => localStorage.getItem('authToken');

// Create a single, configured axios instance for ALL authenticated requests
const authAxios = axios.create({
  baseURL: API_BASE_URL,
});

// This interceptor automatically attaches the auth token to every request made with `authAxios`.
authAxios.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ====================================================================
// --- AUTHENTICATION ---
// ====================================================================
export const loginUser = async (email, password) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);
  const response = await axios.post(`${API_BASE_URL}/api/auth/login`, params);
  return response.data;
};

export const registerUser = async (email, password) => {
  const response = await axios.post(`${API_BASE_URL}/api/auth/register`, { email, password });
  return response.data;
};

export const fetchCurrentUser = async () => {
  const response = await authAxios.get('/api/auth/me');
  return response.data;
};

export const logoutUser = async () => {
    await authAxios.post('/api/auth/logout');
    localStorage.removeItem('authToken');
};

// ====================================================================
// --- AUTHENTICATED API CALLS (All use `authAxios`) ---
// ====================================================================

// --- Core RAG & Chat ---
export const askQuestion = async (query, lang = 'en', sessionId = null, agentId = null) => {
  const payload = { query, lang };
  if (sessionId) payload.session_id = sessionId;
  if (agentId) payload.agent_id = agentId;
  const response = await authAxios.post('/api/ask', payload);
  return response.data;
};

// --- Agent Management ---
export const fetchMyAgents = async () => {
    const response = await authAxios.get('/api/agents');
    return response.data;
};

export const fetchAgentDetails = async (agentId) => {
    const response = await authAxios.get(`/api/agents/${agentId}`);
    return response.data;
};

export const createAgent = async (agentSpec) => {
    const response = await authAxios.post('/api/agents', agentSpec);
    return response.data;
};

export const updateAgent = async (agentId, agentSpec) => {
    const response = await authAxios.put(`/api/agents/${agentId}`, agentSpec);
    return response.data;
};

export const deleteAgent = async (agentId) => {
    await authAxios.delete(`/api/agents/${agentId}`);
};

// --- Workflow Management ---
export const fetchMyWorkflows = async () => {
    const response = await authAxios.get('/api/workflows');
    return response.data;
};

export const fetchWorkflowDetails = async (workflowId) => {
    const response = await authAxios.get(`/api/workflows/${workflowId}`);
    return response.data;
};

export const createWorkflow = async (workflowData) => {
    const response = await authAxios.post('/api/workflows', workflowData);
    return response.data;
};

export const updateWorkflow = async (workflowId, workflowData) => {
    const response = await authAxios.put(`/api/workflows/${workflowId}`, workflowData);
    return response.data;
};

export const deleteWorkflow = async (workflowId) => {
    await authAxios.delete(`/api/workflows/${workflowId}`);
};


// --- Knowledge Base ---
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await authAxios.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const ingestUrl = async (url) => {
    const response = await authAxios.post('/api/ingest-url', { url });
    return response.data;
};

export const ingestKnowledgeBase = async () => {
    const response = await authAxios.post('/api/ingest-knowledge-base');
    return response.data;
};

// --- Chat History ---
export const fetchChatHistory = async (sessionId) => {
    const response = await authAxios.get(`/api/chat-history/${sessionId}`);
    return response.data;
};

// --- Studio Configuration (Supervisor & Assistants) ---
// (This section was incomplete)
export const getSupervisorProfile = async () => {
  const response = await authAxios.get('/api/get-supervisor-profile');
  return response.data;
};

export const getAssistantsConfig = async () => {
  const response = await authAxios.get('/api/get-assistants-config');
  return response.data;
};

// <<< FUNCTION THAT FIXES THE ERROR >>>
export const saveAssistantsConfig = async (assistants) => {
  // The backend expects an object with an "assistants" key
  const response = await authAxios.post('/api/save-assistants-config', { assistants });
  return response.data;
};

// <<< MISSING FUNCTION ADDED FOR COMPLETENESS >>>
export const saveSupervisorProfile = async (profile) => {
  const response = await authAxios.post('/api/save-supervisor-profile', profile);
  return response.data;
};
// <<< END OF FIXES >>>


// ====================================================================
// --- PUBLIC API CALLS (Use the base axios instance for unauthenticated requests) ---
// ====================================================================

export const fetchPublicAgentConfig = async (agentId, apiKey) => {
  if (!agentId || !apiKey) {
      throw new Error("Agent ID and API Key are required to fetch public agent configuration.");
  }
  const headers = { 'X-API-Key': apiKey };
  const response = await axios.get(`${API_BASE_URL}/api/agents/public/${agentId}`, { headers });
  return response.data;
};

export const publicAskQuestion = async (query, sessionId, apiKey, agentId) => {
    if (!apiKey || !agentId) {
        throw new Error("API Key and Agent ID are required for public chat interaction.");
    }
    const payload = { query };
    if (sessionId) { payload.session_id = sessionId; }
    const headers = { 'X-API-Key': apiKey };
    const response = await axios.post(`${API_BASE_URL}/api/ask/public/${agentId}`, payload, { headers });
    return response.data;
};

export const fetchPublicWorkflowDefinition = async (flowId) => {
    if (!flowId) {
        throw new Error("Flow ID is required to fetch a public workflow definition.");
    }
    const response = await axios.get(`${API_BASE_URL}/api/workflows/public/${flowId}`);
    return response.data;
};


// ====================================================================
// --- WORKFLOW TRIGGERS (Public, but use a specific key) ---
// ====================================================================
export const triggerChatMessage = async (payload, apiKey) => {
    const headers = {
        'Content-Type': 'application/json',
        'X-Workflow-API-Key': apiKey,
    };
    const response = await axios.post(`${API_BASE_URL}/api/trigger/chat_message`, payload, { headers });
    return response.data;
};

export const triggerFormSubmission = async (payload, apiKey) => {
    const headers = {
        'Content-Type': 'application/json',
        'X-Workflow-API-Key': apiKey,
    };
    const response = await axios.post(`${API_BASE_URL}/api/trigger/form_submission`, payload, { headers });
    return response.data;
};

// ====================================================================
// --- WEBSOCKET HELPER ---
// ====================================================================
export const getWebSocketUrl = (sessionId) => {
    const token = getToken();
    if (!token || token === 'undefined') {
        throw new Error("Authentication token not found for an interactive session.");
    }
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const baseUrlWithoutProtocol = API_BASE_URL.replace(/^(http|https):\/\//, '');
    return `${wsProtocol}://${baseUrlWithoutProtocol}/ws?session_id=${sessionId}&token=${token}`;
};

/**
 * Executes a workflow with a given input.
 * @param {string} workflowId The ID of the workflow to execute.
 * @param {object} inputData The initial data for the trigger node.
 * @returns {Promise<object>} The final output from the workflow execution.
 */
export const executeWorkflow = async (workflowId, inputData) => {
    const payload = { input_data: inputData };
    const response = await authAxios.post(`/api/workflows/${workflowId}/execute`, payload);
    return response.data;
};


// ====================================================================
// --- Tool Management ---
// ====================================================================
export const fetchTools = async () => {
    const response = await authAxios.get('/api/tools');
    return response.data;
};

export const saveTools = async (tools) => {
    // The backend expects a list of tools
    const response = await authAxios.post('/api/tools', tools);
    return response.data;
};