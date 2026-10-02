import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokens } from '../services/api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return tokens.get('ch_access') ? JSON.parse(tokens.get('ch_user')) : null; } catch { return null; }
  });
  const [loading, setLoading] = useState(!!tokens.get('ch_access'));

  // Re-validate the stored session with the backend on page load.
  useEffect(() => {
    if (!tokens.get('ch_access')) return;
    api.get('/profile/')
      .then((r) => { setUser(r.data); tokens.setUser(r.data); })
      .catch((e) => { if (e.response?.status === 401) { tokens.clear(); setUser(null); } })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const out = () => setUser(null);
    window.addEventListener('auth:logout', out);
    return () => window.removeEventListener('auth:logout', out);
  }, []);

  const login = useCallback(async (identifier, password, remember) => {
    const { data } = await api.post('/login/', { identifier, password });
    tokens.set(data.access, data.refresh, remember, data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (form) => {
    const { data } = await api.post('/register/', form);
    tokens.set(data.access, data.refresh, true, data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/logout/', { refresh: tokens.get('ch_refresh') }); } catch { /* ignore */ }
    tokens.clear();
    setUser(null);
  }, []);

  const updateUser = useCallback((u) => { setUser(u); tokens.setUser(u); }, []);

  return <AuthCtx.Provider value={{ user, loading, login, register, logout, updateUser }}>{children}</AuthCtx.Provider>;
}
