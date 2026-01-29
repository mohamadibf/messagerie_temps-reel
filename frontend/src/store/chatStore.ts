import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Message } from "@/types";

export type { User, Message };

interface ChatState {
  messages: Message[];
  isConnected: boolean;
  isLoading: boolean;
  inputValue: string;
  suggestions: string[];
  currentUser: User | null;
  selectedContact: User | null;
  contacts: User[];
  token: string | null;

  // Actions
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setInputValue: (value: string) => void;
  setSuggestions: (suggestions: string[]) => void;
  setCurrentUser: (user: User | null) => void;
  setSelectedContact: (contact: User | null) => void;
  setContacts: (contacts: User[]) => void;
  setToken: (token: string | null) => void;
  clearMessages: () => void;
  logout: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isConnected: false,
      isLoading: false,
      inputValue: "",
      suggestions: [],
      currentUser: null,
      selectedContact: null,
      contacts: [],
      token: null,

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      setMessages: (messages) => set({ messages }),

      setConnected: (connected) => set({ isConnected: connected }),

      setLoading: (loading) => set({ isLoading: loading }),

      setInputValue: (value) => set({ inputValue: value }),

      setSuggestions: (suggestions) => set({ suggestions }),

      setCurrentUser: (user) => set({ currentUser: user }),

      setSelectedContact: (contact) => set({ selectedContact: contact }),

      setContacts: (contacts) => set({ contacts }),

      setToken: (token) => set({ token }),

      clearMessages: () => set({ messages: [] }),

      logout: () =>
        set({
          currentUser: null,
          selectedContact: null,
          messages: [],
          contacts: [],
          isConnected: false,
          token: null,
        }),
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        currentUser: state.currentUser,
        token: state.token,
      }),
    },
  ),
);
