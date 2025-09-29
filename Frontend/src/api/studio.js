import { studioAxios } from './axios';

const studioApi = {
  saveFlow: async (flowData) => {
    if (flowData.id) {
      return (await studioAxios.put(`/save-flow/${flowData.id}`, flowData)).data;
    }
    return (await studioAxios.post('/save-flow', flowData)).data;
  },

  getFlow: async (flowId) => (await studioAxios.get(`/get-flow/${flowId}`)).data,
  listFlows: async () => (await studioAxios.get('/list-flows')).data,
  deleteFlow: async (flowId) => (await studioAxios.delete(`/delete-flow/${flowId}`)).data,
  deployFlow: async (flowId) => (await studioAxios.post(`/deploy-flow/${flowId}`)).data,
  runFlow: async (flowId, inputData = {}) =>
    (await studioAxios.post(`/run-flow/${flowId}`, inputData)).data,

  saveSupervisorProfile: async (profile) =>
    (await studioAxios.post('/save-supervisor-profile', profile)).data,
  getSupervisorProfile: async (id) =>
    (await studioAxios.get(`/get-supervisor-profile/${id}`)).data,

  saveAssistantsConfig: async (config) =>
    (await studioAxios.post('/save-assistants-config', config)).data,
  getAssistantsConfig: async (id) =>
    (await studioAxios.get(`/get-assistants-config/${id}`)).data,

  handleApiError: (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        localStorage.removeItem('authToken');
        return 'Authentication error. Please log in again.';
      }
      if (status === 403) return 'You do not have permission.';
      if (status === 404) return 'Resource not found.';
      return data?.detail || data?.message || 'Unexpected server error';
    }
    if (error.request) return 'No response from server. Check your connection.';
    return 'Unexpected error occurred.';
  }
};

export default studioApi;
