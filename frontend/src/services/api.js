import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';
const KEYS = ['ch_access', 'ch_refresh', 'ch_user'];

// "Remember me" -> localStorage (persists); otherwise sessionStorage (cleared when the tab closes).
export const tokens = {
  get: (k) => localStorage.getItem(k) ?? sessionStorage.getItem(k),
  _store: () => (localStorage.getItem('ch_refresh') ? localStorage : sessionStorage),
  set(access, refresh, remember, user) {
    this.clear();
    const s = remember ? localStorage : sessionStorage;
    s.setItem('ch_access', access);
    s.setItem('ch_refresh', refresh);
    if (user) s.setItem('ch_user', JSON.stringify(user));
  },
  update(access, refresh) {
    const s = this._store();
    s.setItem('ch_access', access);
    if (refresh) s.setItem('ch_refresh', refresh);
  },
  setUser(user) { this._store().setItem('ch_user', JSON.stringify(user)); },
  clear() { KEYS.forEach((k) => { localStorage.removeItem(k); sessionStorage.removeItem(k); }); },
};

export const api = axios.create({ baseURL: BASE, timeout: 20000 });

api.interceptors.request.use((config) => {
  const t = tokens.get('ch_access');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

let refreshing = null;
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { config, response } = error;
    const isAuthCall = config?.url?.match(/\/(login|register|token\/refresh)\//);
    if (response?.status === 401 && config && !config._retry && !isAuthCall && tokens.get('ch_refresh')) {
      config._retry = true;
      try {
        refreshing = refreshing || axios.post(`${BASE}/token/refresh/`, { refresh: tokens.get('ch_refresh') });
        const { data } = await refreshing;
        refreshing = null;
        tokens.update(data.access, data.refresh);
        config.headers.Authorization = `Bearer ${data.access}`;
        return api(config);
      } catch (e) {
        refreshing = null;
        tokens.clear();
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

// Turn any axios/DRF error into a readable string.
export function errMsg(err) {
  if (!err.response) return 'Cannot reach the server. Check your internet connection and that the backend is running.';
  const d = err.response.data;
  if (typeof d === 'string') return err.response.status >= 500 ? 'Server error. Please try again.' : d.slice(0, 200);
  if (d?.detail) return String(d.detail);
  if (d && typeof d === 'object') {
    return Object.entries(d)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${Array.isArray(v) ? v.join(' ') : typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' | ');
  }
  return 'Something went wrong. Please try again.';
}

// Field-level errors (for forms) -> { field: 'message' }
export function fieldErrors(err) {
  const d = err.response?.data;
  if (!d || typeof d !== 'object' || d.detail) return {};
  return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, Array.isArray(v) ? v.join(' ') : String(v)]));
}

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const dateFmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
