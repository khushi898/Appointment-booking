import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { api, setUnauthorizedHandler, tokenStorage } from '../lib/api';

// Keeps track of who is logged in and shares it with the whole app.
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // If a token is saved we must ask the API who it belongs to before showing pages
  const [loading, setLoading] = useState(() => Boolean(tokenStorage.get()));

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  // Any 401 from the API (expired or invalid token) logs the user out
  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  // On page load: restore the session from the saved token
  useEffect(() => {
    if (!tokenStorage.get()) return;
    api
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(logout)
      .finally(() => setLoading(false));
  }, [logout]);

  // Save the token and user from a login/register response
  const startSession = useCallback(({ data }) => {
    tokenStorage.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback((credentials) => api.post('/auth/login', credentials).then(startSession), [startSession]);
  const register = useCallback((details) => api.post('/auth/register', details).then(startSession), [startSession]);

  // useMemo so components only re-render when these values actually change
  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'admin', login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
