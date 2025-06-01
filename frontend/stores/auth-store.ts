import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  username: string;
  // email: string;  // Removed for hackathon
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string) => Promise<void>;  // Simplified for hackathon
  register: (data: { username: string }) => Promise<void>;  // Simplified for hackathon
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (username: string) => {  // Simplified for hackathon
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(username);  // No password needed
      const { access_token } = response;
      localStorage.setItem('token', access_token);
      
      // Get user data
      const user = await authApi.getMe();
      
      set({ token: access_token, user, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Login failed', isLoading: false });
      throw error;
    }
  },

  register: async (data: { username: string }) => {  // Simplified for hackathon
    set({ isLoading: true, error: null });
    try {
      await authApi.register(data);
      // Auto login after registration
      await useAuthStore.getState().login(data.username);
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Registration failed', isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    set({ isLoading: true });
    try {
      const user = await authApi.getMe();
      set({ user, token, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isLoading: false });
    }
  },
})); 