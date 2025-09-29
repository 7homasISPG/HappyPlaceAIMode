// src/api/axios.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const STUDIO_API_BASE_URL = import.meta.env.VITE_STUDIO_API_BASE_URL || 'http://127.0.0.1:8001';

const getToken = () => localStorage.getItem('authToken');

// Core backend (auth, RAG, KB, chat)
export const coreAxios = axios.create({ baseURL: API_BASE_URL });

// Studio backend (flows, agent config, deployments)
export const studioAxios = axios.create({ baseURL: STUDIO_API_BASE_URL });

// Interceptor to inject auth token
[coreAxios, studioAxios].forEach(instance => {
  instance.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );
});
