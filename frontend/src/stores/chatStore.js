import create from "zustand";

export const useChatStore = create((set) => ({
  messages: [],
  unreadCount: 0,
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
      unreadCount: state.unreadCount + 1,
    })),
  markRead: () => set(() => ({ unreadCount: 0 })),
}));
