import { create } from 'zustand';
import { User, Conversation } from '@/lib/types';

interface ChatState {
  selectedUser: User | null;
  selectedConversation: Conversation | null;
  
  selectUser: (user: User) => void;
  selectConversation: (conversation: Conversation) => void;
  clearSelection: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  selectedUser: null,
  selectedConversation: null,
  
  selectUser: (user) => set({ selectedUser: user }),
  
  selectConversation: (conversation) => set({ selectedConversation: conversation }),
  
  clearSelection: () => set({ selectedUser: null, selectedConversation: null }),
})); 