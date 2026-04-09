import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { setToken, setRefreshToken, clearToken, clearRefreshToken, onUnauthorized, TOKEN_KEY, tryRefreshTokens, getToken } from '../lib/api';
import { secureStorage } from './storage';

const USER_KEY = '@p2ptax_user';

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  username: string | null;
  isNewUser: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'LOGIN'; payload: { token: string; user: AuthUser } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESTORE'; payload: { token: string; user: AuthUser } | null }
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_EMAIL'; payload: { email: string; token: string } }
  | { type: 'CLEAR_NEW_USER' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isLoading: false,
      };
    case 'LOGOUT':
      return { user: null, token: null, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'RESTORE':
      return {
        user: action.payload?.user ?? null,
        token: action.payload?.token ?? null,
        isLoading: false,
      };
    case 'SET_USERNAME':
      if (!state.user) return state;
      return {
        ...state,
        user: { ...state.user, username: action.payload, isNewUser: false },
      };
    case 'SET_EMAIL':
      if (!state.user) return state;
      return {
        ...state,
        token: action.payload.token,
        user: { ...state.user, email: action.payload.email },
      };
    case 'CLEAR_NEW_USER':
      if (!state.user) return state;
      return {
        ...state,
        user: { ...state.user, isNewUser: false },
      };
    default:
      return state;
  }
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
};

interface AuthContextValue extends AuthState {
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  clearNewUser: () => Promise<void>;
  completeOnboarding: (username: string) => Promise<void>;
  updateEmail: (email: string, accessToken: string, refreshToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore persisted session on mount
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const [token, userJson] = await Promise.all([
          secureStorage.getItem(TOKEN_KEY),
          secureStorage.getItem(USER_KEY),
        ]);

        if (!cancelled) {
          if (token && userJson) {
            const user = JSON.parse(userJson) as AuthUser;
            // Try to refresh token proactively on restore; if refresh fails the
            // 401-handler will clear the session on next API call
            await tryRefreshTokens();
            const freshToken = (await getToken()) ?? token;
            dispatch({ type: 'RESTORE', payload: { token: freshToken, user } });
          } else {
            dispatch({ type: 'RESTORE', payload: null });
          }
        }
      } catch {
        if (!cancelled) {
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
      dispatch({ type: 'LOGOUT' });
      Promise.all([
        secureStorage.removeItem(TOKEN_KEY),
        secureStorage.removeItem(USER_KEY),
        clearRefreshToken(),
      ]).catch(() => {});
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (token: string, user: AuthUser) => {
    await Promise.all([
      setToken(token),
      secureStorage.setItem(USER_KEY, JSON.stringify(user)),
    ]);
    dispatch({ type: 'LOGIN', payload: { token, user } });
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      clearToken(),
      clearRefreshToken(),
      secureStorage.removeItem(USER_KEY),
    ]);
    dispatch({ type: 'LOGOUT' });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  // Called after role selection (CLIENT) — clears isNewUser flag to prevent redirect loop (#323)
  const clearNewUser = useCallback(async () => {
    dispatch({ type: 'CLEAR_NEW_USER' });
    const userJson = await secureStorage.getItem(USER_KEY);
    if (userJson) {
      const existing = JSON.parse(userJson) as AuthUser;
      const updated: AuthUser = { ...existing, isNewUser: false };
      await secureStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
  }, []);

  // Called after onboarding completes — clears isNewUser flag and stores username
  const completeOnboarding = useCallback(async (username: string) => {
    dispatch({ type: 'SET_USERNAME', payload: username });
    // Persist updated user (isNewUser=false, username set) to secure storage
    const userJson = await secureStorage.getItem(USER_KEY);
    if (userJson) {
      const existing = JSON.parse(userJson) as AuthUser;
      const updated: AuthUser = { ...existing, username, isNewUser: false };
      await secureStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
  }, []);

  // Called after successful email change — replaces email and new tokens in state + storage
  const updateEmail = useCallback(async (email: string, accessToken: string, refreshToken: string) => {
    await Promise.all([
      setToken(accessToken),
      setRefreshToken(refreshToken),
    ]);
    dispatch({ type: 'SET_EMAIL', payload: { email, token: accessToken } });
    // Persist updated user email to secure storage
    const userJson = await secureStorage.getItem(USER_KEY);
    if (userJson) {
      const existing = JSON.parse(userJson) as AuthUser;
      const updated: AuthUser = { ...existing, email };
      await secureStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    setLoading,
    clearNewUser,
    completeOnboarding,
    updateEmail,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
