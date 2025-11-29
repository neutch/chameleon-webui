import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth endpoints
export const login = (pin) => api.post('/auth/login', { pin });
export const logout = () => api.post('/auth/logout');
export const verifyAuth = () => api.get('/auth/verify');

// Data endpoints
export const getSources = () => api.get('/sources');
export const getOutputs = () => api.get('/outputs');
export const getConfig = () => api.get('/config');

// Routing endpoint
export const routeOutput = (outputId, inputId, mode = 'B') =>
  api.post('/route', { outputId, inputId, mode });

// Admin endpoints
export const updateSources = (sources) => api.put('/admin/sources', sources);
export const updateOutputs = (outputs) => api.put('/admin/outputs', outputs);
export const updateConfig = (config) => api.put('/admin/config', config);

// Status endpoint
export const getStatus = () => api.get('/status');

export default api;
