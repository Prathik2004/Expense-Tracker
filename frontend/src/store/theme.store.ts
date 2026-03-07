import { create } from 'zustand';

interface ThemeState {
    theme: 'dark' | 'light' | 'system';
    setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    theme: 'system',
    setTheme: (theme) => set({ theme }),
}));
