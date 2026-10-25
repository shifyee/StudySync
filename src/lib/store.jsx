import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken, onOffline } from './api.js';

const Ctx = createContext(null);
const THEME_KEY = 'studysync_theme';
const SIDEBAR_KEY = 'studysync_sidebar';

export function AppProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(!!getToken());
  const [theme, setTheme] = useState(() => {
    try { return JSON.parse(localStorage.getItem(THEME_KEY) || '{}'); } catch { return {}; }
  });
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) !== '0'; } catch { return true; }
  });
  const [toast, setToastState] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToastState({ message, type, id: Date.now() });
    setTimeout(() => setToastState(null), 3500);
  }, []);

  useEffect(() => { onOffline(() => showToast('Backend unreachable — showing saved data', 'warn')); }, [showToast]);

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then(setUserState)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const dark = theme.dark ?? matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('contrast', !!theme.contrast);
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_KEY, sidebarOpen ? '1' : '0'); } catch {}
  }, [sidebarOpen]);

  const login = async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    setToken(data.token); setUserState(data.user);
  };
  const register = async (name, email, password) => {
    const data = await api('/auth/register', { method: 'POST', body: { name, email, password } });
    setToken(data.token); setUserState(data.user);
  };
  const logout = () => { setToken(null); setUserState(null); };

  const isDark = theme.dark ?? matchMedia('(prefers-color-scheme: dark)').matches;
  const toggleDark = () => setTheme((t) => ({ ...t, dark: !isDark }));
  const toggleContrast = () => setTheme((t) => ({ ...t, contrast: !t.contrast }));
  const toggleSidebar = () => setSidebarOpen((s) => !s);

  return (
    <Ctx.Provider value={{
      user, setUser: setUserState, loading, login, register, logout,
      isDark, toggleDark,
      contrast: !!theme.contrast, toggleContrast,
      toast: showToast,
      sidebarOpen, toggleSidebar,
    }}>
      {children}
      {toast && (
        <div role="status" aria-live="polite" className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[90] rounded-lg px-4 py-2.5 text-sm shadow-lg animate-fade-in ${toast.type === 'error' ? 'bg-destructive text-destructive-foreground' : toast.type === 'warn' ? 'bg-amber-500 text-black' : 'bg-foreground text-background'}`}>
          {toast.message}
        </div>
      )}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
