import axios from 'axios';

// Use environment variable for API URL, default to /api for development (Vite proxy)
const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

// Generate or get visitor ID for anonymous view tracking
const getVisitorId = () => {
  let visitorId = localStorage.getItem('visitorId');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('visitorId', visitorId);
  }
  return visitorId;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token and visitor ID to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add visitor ID for view tracking
    config.headers['x-visitor-id'] = getVisitorId();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};

// Articles API
export const articlesAPI = {
  getAll: (params) => api.get('/articles', { params }),
  getOne: (id) => api.get(`/articles/${id}`),
  create: (articleData) => api.post('/articles', articleData),
  like: (id) => api.post(`/articles/${id}/like`),
  dislike: (id) => api.post(`/articles/${id}/dislike`),
  getLiveUpdates: () => api.get('/articles/live-updates'),
};

// VAPID Public Key for push notifications
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEcfBfX0o_kT-tSaQmSADNLSsB8e8qCzZv5cjfLSTaXtFXk_bVCqrcJDB7Yg5Wvb-UrR718pwh41I9s1Vptv15A';

// Get API base URL for non-axios requests
export const getApiUrl = (path) => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${path}`;
};

export default api;
