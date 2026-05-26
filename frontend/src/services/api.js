/**
 * @fileoverview Axios API client service.
 * Manages connections to the Node.js backend, attaches JWT authorization,
 * and intercepts session expirations.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create configured axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token if it exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle expired tokens / unauthorized access automatically
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error is 401 Unauthorized (session expired or invalid token)
    if (error.response && error.response.status === 401) {
      console.warn('⚠️ Session expired or unauthorized. Cleansing token...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Force reload to redirect to /login via AuthContext/Router
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
