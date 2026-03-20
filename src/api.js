import axios from 'axios';

// Get the base URL from environment variables or default to local development
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * ⭐ CUSTOM AXIOS INSTANCE
 */
const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// ==========================================
// ⭐ REQUEST INTERCEPTOR: Inject JWT & Context
// ==========================================
API.interceptors.request.use(
  (config) => {
    // 1. Inject Authorization Token
    const profile = localStorage.getItem('profile');
    if (profile) {
      try {
        const parsedProfile = JSON.parse(profile);
        const token = parsedProfile?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error("Error parsing profile from localStorage", e);
      }
    }

    const activeCompany = localStorage.getItem('activeCompanyId');
    if (activeCompany) {
      config.headers['x-active-company-id'] = activeCompany;
    }

    /**
     * ⭐ ADMIN & SUBSCRIPTION CONTEXT INJECTION
     * We pull the activeCompanyId directly from localStorage. 
     */
    const activeCompanyId = localStorage.getItem('activeCompanyId');

    // Regex to validate a 24-character MongoDB ObjectId
    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

    // FIX: Only attach the header if it's a valid MongoDB ID. 
    // This prevents sending strings like "all", "null", or "undefined" 
    // which cause the backend 500 errors.
    if (activeCompanyId && isValidObjectId(activeCompanyId)) {
      config.headers['x-active-company-id'] = activeCompanyId;
    } else {
      // Ensure the header is removed if no valid ID is present
      delete config.headers['x-active-company-id'];
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
    const { status, config, data } = error.response || {};

    // 1. Handle Session Expiry or Unauthorized Access (401)
    if (status === 401) {
      if (config.url.includes('/auth/me') || window.location.pathname.includes('/login')) {
        return Promise.reject(error);
      }

      const currentPath = window.location.pathname + window.location.search;

      localStorage.removeItem('profile');
      localStorage.removeItem('activeProjectId');
      localStorage.removeItem('activeCompanyId');

      if (!window.location.pathname.includes('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }

    // 2. Handle Forbidden Access (403) - SUBSCRIPTION LIMITS
    if (status === 403) {
      if (data?.limitReached) {
        console.warn(`[Subscription Limit] ${data.resource}: ${data.message}`);
      } else {
        console.error("Access Denied (403): User lacks required permissions.");
      }
    }

    // 3. Handle Resource Not Found (404)
    if (status === 404) {
      console.error("Resource Not Found (404):", config.url);
    }

    // 4. Global Server Error (500)
    if (status === 500) {
      console.error("Server Error (500):", data?.message || "Internal Server Error");
    }

    return Promise.reject(error);
  }
);

export default API;