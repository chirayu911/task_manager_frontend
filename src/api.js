import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Mandatory for cross-PC session persistence
});

// ==========================================
// ⭐ REQUEST INTERCEPTOR: Inject JWT
// ==========================================
API.interceptors.request.use((config) => {
  const profile = localStorage.getItem('profile');
  if (profile) {
    try {
      const token = JSON.parse(profile).token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Error parsing profile from localStorage", e);
    }
  }
  return config;
});

// ==========================================
// ⭐ RESPONSE INTERCEPTOR: Auth & Error Handling
// ==========================================
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, config } = error.response || {};

    // 1. Handle Session Expiry (401 Unauthorized)
    if (status === 401) {
      // Ignore 401s for the session check route to prevent infinite loops
      if (config.url.includes('/auth/me')) {
        return Promise.reject(error);
      }

      // Capture current path + query strings (e.g., ?requestId=123&openRequest=true)
      const currentPath = window.location.pathname + window.location.search;
      
      // Clear local auth state
      localStorage.removeItem('profile');

      // Force redirect to login with a return path
      // This ensures that after login, the user lands back on the Document Modal
      if (!window.location.pathname.includes('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }

    // 2. Global Error Logging
    if (status === 500) {
      console.error("Internal Server Error (500):", error.response.data);
    }

    return Promise.reject(error);
  }
);

export default API;