import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL 
|| 'http://localhost:5000/api';

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// api.js
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, config } = error.response || {};

    // ⭐ Ignore 401s for the session check route
    if (status === 401 && config.url.includes('/auth/me')) {
      return Promise.reject(error); 
    }

    if (status === 401) {
      console.warn("Session expired - Redirecting to login...");
    }

    return Promise.reject(error);
  }
);
export default API;