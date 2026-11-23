import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach appropriate JWT token
api.interceptors.request.use(
  (config) => {
    // If request is to admin endpoint, attach admin token
    if (config.url?.startsWith('/admin') || config.url?.startsWith('/upload')) {
      const adminToken = localStorage.getItem('admin_token');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      // Customer endpoints
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
      error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
