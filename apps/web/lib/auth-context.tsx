'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, type AuthUser } from './api/auth';
import { clearAccessToken, getAccessToken, setAccessToken } from './auth-token';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** Lưu token + user sau khi đăng nhập thành công. */
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục phiên từ token đã lưu (gọi /me).
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me(token)
      .then(setUser)
      .catch(() => clearAccessToken())
      .finally(() => setLoading(false));
  }, []);

  const signIn = (token: string, u: AuthUser) => {
    setAccessToken(token);
    setUser(u);
  };

  const signOut = () => {
    clearAccessToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth phải dùng trong <AuthProvider>');
  }
  return ctx;
}
