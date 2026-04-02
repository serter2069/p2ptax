import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setToken, clearToken, onUnauthorized } from '../lib/api';

const TOKEN_KEY = '@p2ptax_token';
const USER_KEY = '@p2ptax_user';

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
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
  | { type: 'RESTORE'; payload: { token: string; user: AuthUser } | null };

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
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        if (!cancelled) {
          if (token && userJson) {
            const user = JSON.parse(userJson) as AuthUser;
            dispatch({ type: 'RESTORE', payload: { token, user } });
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
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]).catch(() => {});
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (token: string, user: AuthUser) => {
    await Promise.all([
      setToken(token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
    ]);
    dispatch({ type: 'LOGIN', payload: { token, user } });
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      clearToken(),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    dispatch({ type: 'LOGOUT' });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    setLoading,
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
