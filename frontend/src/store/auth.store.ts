import { create } from 'zustand';
import api from '../lib/api';

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (credentials: any) => Promise<void>;
    register: (userData: any) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isLoading: true,

    login: async (credentials) => {
        const res = await api.post('/auth/login', credentials);
        const { access_token, user } = res.data;
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token: access_token });
    },

    register: async (userData) => {
        const res = await api.post('/auth/register', userData);
        const { access_token, user } = res.data;
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token: access_token });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null });
        window.location.href = '/login';
    },

    checkAuth: async () => {
        try {
            if (typeof window === 'undefined') return;

            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (!token) {
                set({ user: null, token: null, isLoading: false });
                return;
            }

            set({
                token,
                user: userStr ? JSON.parse(userStr) : null,
                isLoading: false
            });

            // Optionally verify with backend
            // const res = await api.get('/auth/me');
            // set({ user: res.data, isLoading: false });
        } catch (err) {
            set({ user: null, token: null, isLoading: false });
            localStorage.removeItem('token');
        }
    }
}));
