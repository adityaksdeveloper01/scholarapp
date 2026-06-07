import { create } from 'zustand';
import { Role, AppUser } from '../types';

interface AppState {
  role: Role;
  hasSelectedRole: boolean;
  isAuthenticated: boolean;
  user: AppUser | null;
  setRole: (role: Role) => void;
  setHasSelectedRole: (hasSelectedRole: boolean) => void;
  login: (user: AppUser) => void;
  logout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: 'student', // Default role
  hasSelectedRole: false,
  isAuthenticated: false,
  user: null,
  setRole: (role) => set({ role }),
  setHasSelectedRole: (hasSelectedRole) => set({ hasSelectedRole }),
  login: (user) => set({ isAuthenticated: true, user, role: user.role, hasSelectedRole: true }),
  logout: () => set({ isAuthenticated: false, user: null, hasSelectedRole: false }),
  theme: 'light',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));
