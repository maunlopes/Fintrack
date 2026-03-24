import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isStreaming: boolean;
  prefillInput: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  openWithPrefill: (msg: string) => void;
  clearPrefill: () => void;
  clearMessages: () => void;
  addMessage: (msg: ChatMessage) => void;
  appendToLast: (chunk: string) => void;
  setStreaming: (v: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  messages: [],
  isStreaming: false,
  prefillInput: null,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  openWithPrefill: (msg) => set({ isOpen: true, prefillInput: msg }),
  clearPrefill: () => set({ prefillInput: null }),
  clearMessages: () => set({ messages: [], isStreaming: false }),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  appendToLast: (chunk) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const msgs = [...s.messages];
      msgs[msgs.length - 1] = {
        ...msgs[msgs.length - 1],
        content: msgs[msgs.length - 1].content + chunk,
      };
      return { messages: msgs };
    }),

  setStreaming: (v) => set({ isStreaming: v }),
}));
