import { coreAxios } from './axios';

export const askQuestion = async (query, lang = 'en', sessionId = null, assistants = null) => {
  const payload = { query, lang };
  if (sessionId) payload.session_id = sessionId;
  if (assistants) payload.assistants = assistants;
  return (await coreAxios.post('/api/ask', payload)).data;
};

export const getWebSocketUrl = (sessionId) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error("No valid token found. Please log in again.");
  
  const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
  const wsApiUrl = `${wsProtocol}://${API_BASE_URL.split('//')[1]}`;
  return `${wsApiUrl}/ws?session_id=${sessionId}&token=${token}`;
};
