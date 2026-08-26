import { create } from 'zustand';

export const useSessionStore = create((set) => ({
  userId: 'demo-user',
  nickname: 'Demo User',
  setSession: (userId, nickname) => set({ userId, nickname }),
}));
