import axios from 'axios';

// API base URL - use environment variable or fallback to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// External API base URL
const EXTERNAL_API_BASE_URL = 'https://dev.getpaya.com/api';

// External API Key - should be stored in environment variable
const EXTERNAL_API_KEY = process.env.REACT_APP_EXTERNAL_API_KEY;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Check if this is an external API call
    if (config.url && config.url.startsWith('/v1/external/')) {
      // Use external API base URL
      config.baseURL = EXTERNAL_API_BASE_URL;
      // Add X-API-Key header for external API
      config.headers['X-API-Key'] = EXTERNAL_API_KEY;
    } else {
      // For internal API calls, add Bearer token
      const token = localStorage.getItem('merchantToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('merchantToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL, EXTERNAL_API_BASE_URL, EXTERNAL_API_KEY };
