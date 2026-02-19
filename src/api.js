import axios from 'axios';

// Create axios instance with base configuration
const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Adjust this to your backend port
  withCredentials: true, // CRITICAL: Allows cookies (JWT) to be sent with every request
});

/**
 * Response Interceptor
 * This intercepts every response from the backend. 
 * If the backend returns a 401 (Unauthorized) or 403 (Forbidden), 
 * we can handle the UI logic here globally.
 */
API.interceptors.response.use(
  (response) => {
    // If request is successful, simply return the response
    return response;
  },
  (error) => {
    const { status } = error.response || {};

    if (status === 401) {
      // Scenario: Token expired or user not logged in
      console.warn("Unauthorized access - Redirecting to login...");
      // Optional: window.location.href = '/'; 
    }

    if (status === 403) {
      // Scenario: User is logged in but lacks specific permission for this API route
      console.error("Forbidden: You do not have permission for this action.");
      // You could trigger a global toast notification here
    }

    return Promise.reject(error);
  }
);

export default API;