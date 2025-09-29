// src/api/auth.js
import axios from 'axios';
import { coreAxios } from './axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const loginUser = async (email, password) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);
  const response = await axios.post(`${API_BASE_URL}/api/auth/login`, params);
  return response.data;
};

export const registerUser = async (name, email, password) => {
  const response = await axios.post(`${API_BASE_URL}/api/auth/register`, { name, email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await coreAxios.get('/api/auth/me');
  return response.data;
};
