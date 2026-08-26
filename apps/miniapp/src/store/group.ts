import { create } from 'zustand';

export const useGroupStore = create((set) => ({
  currentGroupId: '',
  setCurrentGroupId: (currentGroupId) => set({ currentGroupId }),
}));
