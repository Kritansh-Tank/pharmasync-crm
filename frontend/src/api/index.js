import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// ── HCPs ────────────────────────────────────────────────────────────────────
export const fetchHCPs = () => API.get('/hcps/');
export const fetchHCP = (id) => API.get(`/hcps/${id}`);
export const createHCP = (data) => API.post('/hcps/', data);
export const updateHCP = (id, data) => API.put(`/hcps/${id}`, data);
export const deleteHCP = (id) => API.delete(`/hcps/${id}`);

// ── Interactions ─────────────────────────────────────────────────────────────
export const fetchInteractions = () => API.get('/interactions/');
export const fetchInteraction = (id) => API.get(`/interactions/${id}`);
export const createInteraction = (data) => API.post('/interactions/', data);
export const updateInteraction = (id, data) => API.put(`/interactions/${id}`, data);
export const deleteInteraction = (id) => API.delete(`/interactions/${id}`);

// ── Chat ─────────────────────────────────────────────────────────────────────
export const sendChat = (message, session_id = 'default') =>
  API.post('/chat/', { message, session_id });

export const invokeTool = (tool_name, parameters) =>
  API.post('/chat/tool', { tool_name, parameters });

export const fetchTools = () => API.get('/tools');
