
import axios from 'axios';

// Resolve API base URL with fallback to the live Render backend in production
const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://whatsapp-ecommerce-backend-y08o.onrender.com' : '');
const cleanBaseUrl = rawApiUrl ? rawApiUrl.replace(/\/+$/, '') : '';
const apiBaseURL = cleanBaseUrl ? `${cleanBaseUrl}/api` : '/api';

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000, // 30s to comfortably tolerate Render free-tier wake-up cold starts
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (
      config.url?.startsWith('/admin') ||
      config.url?.startsWith('/upload')
    ) {
      const adminToken = localStorage.getItem('admin_token');

      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      const customerToken = localStorage.getItem('customer_token');

      if (customerToken) {
        config.headers.Authorization = `Bearer ${customerToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    return Promise.reject(new Error(message));
  }
);

export default api;
