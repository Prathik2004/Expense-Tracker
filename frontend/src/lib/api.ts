import axios from 'axios';

const getBaseURL = () => {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // If it doesn't start with http, and it's not localhost, prepend https://
    if (!url.startsWith('http') && !url.includes('localhost')) {
        return `https://${url}`;
    }
    return url;
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
