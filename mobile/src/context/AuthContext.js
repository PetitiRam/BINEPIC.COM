import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import client, { TOKEN_KEYS } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const { data } = await client.get('/auth/me');
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEYS.access);
      if (token) await loadMe();
      setBooting(false);
    })();
  }, [loadMe]);

  const persistTokens = async (accessToken, refreshToken) => {
    await SecureStore.setItemAsync(TOKEN_KEYS.access, accessToken);
    await SecureStore.setItemAsync(TOKEN_KEYS.refresh, refreshToken);
  };

  const signIn = async (email, password) => {
    const { data } = await client.post('/auth/signin', { email, password });
    await persistTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  };

  const signUp = async (payload) => {
    const { data } = await client.post('/auth/signup', payload);
    await persistTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data;
  };

  const signOut = async () => {
    const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.refresh);
    try { await client.post('/auth/logout', { refreshToken }); } catch { /* best-effort */ }
    await SecureStore.deleteItemAsync(TOKEN_KEYS.access);
    await SecureStore.deleteItemAsync(TOKEN_KEYS.refresh);
    setUser(null);
  };

  const refreshUser = () => loadMe();

  return (
    <AuthContext.Provider value={{ user, booting, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
