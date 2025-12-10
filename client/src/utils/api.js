import axios from 'axios';

// API base URL - use environment variable or fallback to localhost
const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token (optional)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't require token for all requests (allows guest checkout)
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
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      // Only redirect if user was actually logged in (had a token)
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return undefined;
  if (imagePath.startsWith('http')) return imagePath;

  // Ensure path starts with /
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  // Strip /uploads prefix if present, as we want to use the API route which expects just the ID/filename
  const cleanPath = path.replace(/^\/uploads/, '');

  // Use the API route which handles both GridFS and filesystem lookups
  // API_BASE_URL already includes /api
  return `${API_BASE_URL}/uploads${cleanPath}`;
};

export default api;
export { API_BASE_URL };
