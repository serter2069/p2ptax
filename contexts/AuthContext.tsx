import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { users, auth as authApi } from '../lib/api/endpoints';
import {
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from '../lib/api/storage';

type Role = 'guest' | 'client' | 'specialist' | 'admin';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>('guest');
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = role !== 'guest' && user !== null;

  const fetchUser = useCallback(async () => {
    try {
      const res = await users.getMe();
      const u = res.data as User;
      setUser(u);
      setRole((u.role as Role) || 'client');
    } catch {
      setUser(null);
      setRole('guest');
    }
  }, []);

  // On mount: check for existing token
  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          await fetchUser();
        }
      } catch {
        // no token or failed
      } finally {
        setIsLoading(false);
      }
    })();
  }, [fetchUser]);

  const login = useCallback(
    async (tokens: { accessToken: string; refreshToken: string }) => {
      await setAccessToken(tokens.accessToken);
      await setRefreshToken(tokens.refreshToken);
      await fetchUser();
    },
    [fetchUser],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // logout endpoint may fail, still clear local state
      await clearTokens();
    }
    setUser(null);
    setRole('guest');
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{ user, role, isAuthenticated, isLoading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
