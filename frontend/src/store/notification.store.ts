import { create } from 'zustand';

export type NotificationType = 'idle' | 'loading' | 'success' | 'error' | 'sync';

interface NotificationState {
    type: NotificationType;
    message: string;
    progress?: number;
    isOpen: boolean;

    // Actions
    show: (config: { type: NotificationType; message: string; progress?: number }) => void;
    update: (config: Partial<Exclude<NotificationState, 'show' | 'update' | 'hide'>>) => void;
    hide: () => void;

    // Quick helpers
    success: (message: string) => void;
    error: (message: string) => void;
    loading: (message: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    type: 'idle',
    message: '',
    progress: 0,
    isOpen: false,

    show: (config) => set({ ...config, isOpen: true }),

    update: (config) => set((state) => ({ ...state, ...config })),

    hide: () => set({ isOpen: false }),

    success: (message) => {
        set({ type: 'success', message, isOpen: true });
        setTimeout(() => set({ isOpen: false }), 3000);
    },

    error: (message) => {
        set({ type: 'error', message, isOpen: true });
        setTimeout(() => set({ isOpen: false }), 4000);
    },

    loading: (message) => {
        set({ type: 'loading', message, isOpen: true, progress: 0 });
    }
}));
