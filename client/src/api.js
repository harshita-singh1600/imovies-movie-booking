import axios from 'axios';

const api = axios.create({ baseURL: (import.meta.env.VITE_API_URL || '') + '/api' });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = 'Bearer ' + t;
  return c;
});

export const errMsg = (e, fallback = 'Something went wrong. Please try again.') => e?.response?.data?.message || fallback;
export const when = (d) => new Date(d).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export default api;
