import axios from 'axios';

/**
 * Normalizes the API base URL so it always ends with '/api'.
 * Prevents 404 errors (e.g. [POST] /auth/login) if VITE_API_BASE_URL in Vercel
 * was configured without the '/api' suffix.
 */
export const normalizeApiBaseUrl = (rawUrl) => {
  const url = (rawUrl || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
  return url.endsWith('/api') ? url : `${url}/api`;
};

const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  // Allow up to 60 seconds for Render free tier cold-starts
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  // Prevent double '/api/api/...' if a caller passes '/api/auth/login'
  if (config.url && config.url.startsWith('/api/')) {
    config.url = config.url.replace(/^\/api/, '');
  }

  const token = localStorage.getItem('yg_auth_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  // When sending FormData, delete any Content-Type so the browser automatically
  // generates 'multipart/form-data; boundary=----WebKitFormBoundary...'
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('yg_auth_token');
      localStorage.removeItem('yg_user_v2');
      window.dispatchEvent(new Event('yg-user'));
    }
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error) => {
  // Handle Axios timeout (Render free-tier cold-start)
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return 'The server took longer than expected to respond (the cloud service may be waking up from sleep). Please tap again to proceed.';
  }

  if (error?.message === 'Network Error' || (!error?.response && error?.code === 'ERR_NETWORK')) {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocal) {
      return 'Cannot reach backend server. Please make sure your local backend is running (cd Backend && npm run dev).';
    }
    return 'Unable to reach the backend service. If the cloud server is waking up from sleep, please wait a few seconds and try again.';
  }

  return error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
};

export default api;
