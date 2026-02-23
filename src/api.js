import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://fm8bp5cj-5000.inc1.devtunnels.ms/api';

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ⭐ Mandatory for cross-PC session persistence
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, config } = error.response || {};
    // Ignore 401s for the session check route to prevent loops
    if (status === 401 && config.url.includes('/auth/me')) {
      return Promise.reject(error); 
    }
    return Promise.reject(error);
  }
);

export default API;