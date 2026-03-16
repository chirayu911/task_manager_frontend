import axios from 'axios';

// Get the base URL from environment variables or default to local development
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * ⭐ CUSTOM AXIOS INSTANCE
 * withCredentials: true is critical for allowing the browser to send 
 * and receive cookies (JWT) across different origins/tunnels.
 */
const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// ==========================================
// ⭐ REQUEST INTERCEPTOR: Inject JWT
// ==========================================
API.interceptors.request.use(
  (config) => {
    // Retrieve the user profile from LocalStorage
    const profile = localStorage.getItem('profile');
    
    if (profile) {
      try {
        const parsedProfile = JSON.parse(profile);
        const token = parsedProfile.token;
        
        // If a token exists, inject it into the Authorization header
        // The backend uses this token to extract the companyID and scope data.
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error("Error parsing profile from localStorage", e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// ⭐ RESPONSE INTERCEPTOR: Auth & Error Handling
// ==========================================
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, config } = error.response || {};

    // 1. Handle Session Expiry or Unauthorized Access (401)
    if (status === 401) {
      /**
       * ⭐ PREVENTION OF REDIRECT LOOP
       * We MUST ignore 401 errors for the session check route (/auth/me). 
       * If we don't, failing to find a session will trigger a redirect 
       * to login, which triggers another session check, creating a loop.
       */
      if (config.url.includes('/auth/me') || window.location.pathname.includes('/login')) {
        return Promise.reject(error);
      }

      // Capture current path + query strings (e.g., ?projectId=123)
      // This ensures the user lands back on their specific task/project after re-login.
      const currentPath = window.location.pathname + window.location.search;
      
      // Clear local auth state as the session is no longer valid
      localStorage.removeItem('profile');
      localStorage.removeItem('activeProjectId');

      // Force redirect to login with a return path
      if (!window.location.pathname.includes('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }

    // 2. Handle Forbidden Access (403)
    // This happens if a user tries to access a project from a DIFFERENT company.
    if (status === 403) {
      console.error("Access Denied: You do not have permission for this company data.");
    }

    // 3. Global Error Logging
    if (status === 500) {
      console.error("Internal Server Error (500):", error.response?.data?.message || "Check server logs.");
    }

    return Promise.reject(error);
  }
);

export default API;