import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { client, onUnauthorized } from '../api/client';
import {
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
  getRefreshToken,
} from '../api/storage';
import { secureStorage } from '../../stores/storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  role: 'CLIENT' | 'SPECIALIST' | 'ADMIN';
  isNewUser?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: User['role'] | null;
}

type AuthAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESTORE'; payload: User | null }
  | { type: 'REFRESH_USER'; payload: User };

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------
const USER_KEY = '@p2ptax_user';
const IS_LOGGED_IN_KEY = 'isLoggedIn';

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        role: action.payload.role,
      };
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, isLoading: false, role: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'RESTORE':
      return {
        user: action.payload,
        isAuthenticated: action.payload !== null,
        isLoading: false,
        role: action.payload?.role ?? null,
      };
    case 'REFRESH_USER':
      return {
        ...state,
        user: action.payload,
        role: action.payload.role,
      };
    default:
      return state;
  }
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  role: null,
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface AuthContextValue extends AuthState {
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore persisted session on mount
  useEffect(() => {
    let cancelled = false;

    // Web cold-start: sync read of isLoggedIn to prevent login screen flash
    if (Platform.OS === 'web') {
      try {
        const flag = typeof localStorage !== 'undefined' && localStorage.getItem(IS_LOGGED_IN_KEY);
        if (flag === 'true') {
          dispatch({ type: 'SET_LOADING', payload: true });
        }
      } catch {
        // SSR or restricted context
      }
    }

    async function restore() {
      try {
        const [token, userJson] = await Promise.all([
          getAccessToken(),
          secureStorage.getItem(USER_KEY),
        ]);

        if (cancelled) return;

        if (token && userJson) {
          const cachedUser = JSON.parse(userJson) as User;

          // Validate token by fetching fresh user from API
          try {
            const { data: freshUser } = await client.get<User>('/users/me');
            await secureStorage.setItem(USER_KEY, JSON.stringify(freshUser));
            dispatch({ type: 'RESTORE', payload: freshUser });
          } catch {
            // Token might be expired but refresh interceptor may handle it;
            // if we still have cached data, use it — the 401 interceptor
            // will emit unauthorized if truly invalid
            dispatch({ type: 'RESTORE', payload: cachedUser });
          }
        } else {
          if (Platform.OS === 'web') {
            try { localStorage.removeItem(IS_LOGGED_IN_KEY); } catch {}
          }
          dispatch({ type: 'RESTORE', payload: null });
        }
      } catch {
        if (!cancelled) {
          if (Platform.OS === 'web') {
            try { localStorage.removeItem(IS_LOGGED_IN_KEY); } catch {}
          }
          dispatch({ type: 'RESTORE', payload: null });
        }
      }
    }

    restore();
    return () => { cancelled = true; };
  }, []);

  // Listen for 401 to auto-logout
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      if (Platform.OS === 'web') {
        try { localStorage.removeItem(IS_LOGGED_IN_KEY); } catch {}
      }
      dispatch({ type: 'LOGOUT' });
      Promise.all([
        clearTokens(),
        secureStorage.removeItem(USER_KEY),
      ]).catch(() => {});
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (accessToken: string, refreshToken: string, user: User) => {
    await Promise.all([
      setAccessToken(accessToken),
      setRefreshToken(refreshToken),
      secureStorage.setItem(USER_KEY, JSON.stringify(user)),
    ]);
    if (Platform.OS === 'web') {
      try { localStorage.setItem(IS_LOGGED_IN_KEY, 'true'); } catch {}
    }
    dispatch({ type: 'LOGIN', payload: user });
  }, []);

  const logout = useCallback(async () => {
    // Invalidate refresh token on backend
    const rt = await getRefreshToken();
    if (rt) {
      try {
        await client.post('/auth/logout', { refreshToken: rt });
      } catch {
        // Best-effort — clear local state regardless
      }
    }
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(IS_LOGGED_IN_KEY); } catch {}
    }
    await Promise.all([
      clearTokens(),
      secureStorage.removeItem(USER_KEY),
    ]);
    dispatch({ type: 'LOGOUT' });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data: freshUser } = await client.get<User>('/users/me');
      await secureStorage.setItem(USER_KEY, JSON.stringify(freshUser));
      dispatch({ type: 'REFRESH_USER', payload: freshUser });
    } catch {
      // If refresh fails, keep current state — 401 handler deals with auth issues
    }
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshUser,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
