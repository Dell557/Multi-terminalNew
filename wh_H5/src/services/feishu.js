import axios from 'axios';

const feishuApi = axios.create({
  baseURL: '/bff/feishu',
  timeout: 15000,
});

feishuApi.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

const assertOk = (res, fallbackMessage) => {
  if (res && res.ok) return res.data;
  const message = res?.message || fallbackMessage || 'request failed';
  const error = new Error(message);
  error.payload = res;
  throw error;
};

export const searchFeishuDocs = async (query, offset = 0, size = 20) => {
  const res = await feishuApi.get('/search', {
    params: { query, offset, size }
  });
  return assertOk(res, 'search failed');
};

export const fetchFeishuDoc = async (docId, offset, limit) => {
  const params = { doc_id: docId };
  if (offset != null) params.offset = offset;
  if (limit != null) params.limit = limit;
  const res = await feishuApi.get('/doc', { params });
  return assertOk(res, 'fetch failed');
};

export const listFeishuTools = async () => {
  const res = await feishuApi.get('/tools');
  return assertOk(res, 'tools failed');
};

export const probeFeishuMcp = async () => {
  const res = await feishuApi.get('/probe');
  return assertOk(res, 'probe failed');
};
