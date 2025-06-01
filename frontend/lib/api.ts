import axios from 'axios';
import { User, Conversation, Message, AgentTone } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  register: async (data: { username: string; password?: string }) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  login: async (username: string, password: string = 'dummy') => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post('/api/auth/token', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  completeProfile: async (username: string, email: string, token: string) => {
    const response = await api.post(
      '/api/auth/complete-profile',
      { username, email },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
};

// Chat API
export const chatApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/api/chat/users');
    return response.data;
  },

  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get('/api/chat/conversations');
    return response.data;
  },

  getOrCreateConversation: async (otherUserId: string) => {
    const response = await api.post(`/api/chat/conversation/${otherUserId}`);
    return response.data;
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await api.get(`/api/chat/conversation/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string) => {
    const response = await api.post(`/api/chat/conversation/${conversationId}/send`, {
      content,
    });
    return response.data;
  },

  updateTone: async (conversationId: string, tone: AgentTone, customPrompt?: string) => {
    const response = await api.put(`/api/chat/conversation/${conversationId}/tone`, {
      tone,
      custom_prompt: customPrompt,
    });
    return response.data;
  },
};

export default api; 