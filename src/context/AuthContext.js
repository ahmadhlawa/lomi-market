import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, jsonOptions, restoreApiSession, setApiSession, setSessionExpiredHandler } from '../api/client';
import { clearSession, saveSession } from '../api/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const expire = useCallback(() => {
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setSessionExpiredHandler(expire);
    restoreApiSession().then((stored) => {
      setUser(stored?.user || null);
      setReady(true);
    });
    return () => setSessionExpiredHandler(null);
  }, [expire]);

  const requestOtp = useCallback((phone) => api('/auth/otp/request', jsonOptions('POST', { phone })), []);

  const verifyOtp = useCallback(async (phone, code) => {
    const data = await api('/auth/otp/verify', jsonOptions('POST', { phone, code }), false);
    const next = { accessToken: data.access_token, refreshToken: data.refresh_token, user: data.user };
    setApiSession(next);
    await saveSession(next);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const stored = await restoreApiSession();
    if (stored?.refreshToken) {
      try { await api('/auth/logout', jsonOptions('POST', { refresh_token: stored.refreshToken }), false); } catch {}
    }
    setApiSession(null);
    await clearSession();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    const current = await api('/auth/me');
    setUser(current);
    const stored = await restoreApiSession();
    if (stored) await saveSession({ ...stored, user: current });
    return current;
  }, []);

  const value = useMemo(() => ({ ready, user, authenticated: Boolean(user), requestOtp, verifyOtp, logout, refreshUser }), [ready, user, requestOtp, verifyOtp, logout, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

