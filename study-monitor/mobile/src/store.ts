// src/store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  role: 'admin' | 'student';
  adminPin: string;
  restrictionsActive: boolean;
  bettingBlockActive: boolean;
  setRole: (r: 'admin' | 'student') => void;
  setAdminPin: (p: string) => void;
  setRestrictionsActive: (v: boolean) => void;
  setBettingBlockActive: (v: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      role: 'student',
      adminPin: '',
      restrictionsActive: false,
      bettingBlockActive: false,
      setRole: (role) => set({ role }),
      setAdminPin: (adminPin) => set({ adminPin }),
      setRestrictionsActive: (v) => set({ restrictionsActive: v }),
      setBettingBlockActive: (v) => set({ bettingBlockActive: v }),
    }),
    { name: 'study-monitor', storage: createJSONStorage(() => AsyncStorage) }
  )
);
