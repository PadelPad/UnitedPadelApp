// lib/state/xpStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUserXp, levelFromXp } from '@/lib/gamification';

type XpState = {
  xp: number;
  level: number;
  progress: number; // 0..1
  hydrate: () => Promise<void>;
  setXp: (v: number) => void;
  addXp: (v: number) => void;
};

export const useXpStore = create<XpState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      progress: 0,
      async hydrate() {
        const xp = await fetchUserXp();
        const { level, progress } = levelFromXp(xp);
        set({ xp, level, progress });
      },
      setXp(v) {
        const { level, progress } = levelFromXp(v);
        set({ xp: v, level, progress });
      },
      addXp(v) {
        const newXp = get().xp + v;
        const { level, progress } = levelFromXp(newXp);
        set({ xp: newXp, level, progress });
      },
    }),
    {
      name: 'xp-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ xp: s.xp }), // derive level/progress on hydrate
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const { level, progress } = levelFromXp(state.xp);
        state.level = level;
        state.progress = progress;
      },
    }
  )
);
