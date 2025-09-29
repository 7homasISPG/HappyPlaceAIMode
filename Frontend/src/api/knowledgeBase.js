// src/api/knowledgeBase.js
import { coreAxios } from './axios';

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await coreAxios.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
