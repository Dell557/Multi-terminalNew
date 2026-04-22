import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
});

const pickServerMessage = (payload) => {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;

  return (
    payload?.message ||
    payload?.msg ||
    payload?.error ||
    payload?.detail ||
    ''
  );
};

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      const method = String(response?.config?.method || 'GET').toUpperCase();
      const baseURL = response?.config?.baseURL || '';
      const url = response?.config?.url || '';
      const fullUrl = `${baseURL}${url}`;
      if (fullUrl.includes('/courses/')) {
        console.log('[API Response]', method, fullUrl, response?.data);
      }
    }
    return response.data;
  },
  (error) => {
    const status = error?.response?.status;
    const payload = error?.response?.data;
    if (import.meta.env.DEV) {
      const method = String(error?.config?.method || 'GET').toUpperCase();
      const baseURL = error?.config?.baseURL || '';
      const url = error?.config?.url || '';
      const fullUrl = `${baseURL}${url}`;
      if (fullUrl.includes('/courses/')) {
        console.warn('[API Error]', method, fullUrl, { status, payload, message: error?.message });
      }
    }
    const serverMessage = pickServerMessage(payload);
    const fallbackMessage = error?.message || '请求失败';
    const mergedMessage = serverMessage || fallbackMessage;
    const finalMessage = status ? `HTTP ${status}: ${mergedMessage}` : mergedMessage;

    const wrappedError = new Error(finalMessage);
    wrappedError.status = status || 0;
    wrappedError.payload = payload;
    wrappedError.cause = error;

    return Promise.reject(wrappedError);
  }
);

export default api;
