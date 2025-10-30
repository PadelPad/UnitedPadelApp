// lib/state/notifStore.ts
import { create } from 'zustand';

type NotifState = {
  unread: number;
  setUnread: (n: number) => void;
  markAllRead: () => void;
};

export const useNotifStore = create<NotifState>((set) => ({
  unread: 0,
  setUnread: (n) => set({ unread: Math.max(0, n) }),
  markAllRead: () => set({ unread: 0 }),
}));
