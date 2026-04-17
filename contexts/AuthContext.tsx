import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3812";

const TOKEN_KEY = "p2ptax_access_token";
const REFRESH_KEY = "p2ptax_refresh_token";

export type UserRole = "CLIENT" | "SPECIALIST" | "ADMIN" | null;

export interface UserData {
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  avatarUrl?: string | null;
  isAvailable?: boolean;
}

interface AuthContextType {
  token: string | null;
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (accessToken: string, refreshToken: string, user: UserData) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  updateUser: (data: Partial<UserData>) => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  refreshAuth: async () => false,
  updateUser: () => {},
});

async function storeTokens(accessToken: string, refreshToken: string) {
  await AsyncStorage.setItem(TOKEN_KEY, accessToken);
  await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
}

async function clearTokens() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_KEY);
      if (!refreshToken) return false;

      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        await clearTokens();
        setToken(null);
        setUser(null);
        return false;
      }

      const data = await res.json();
      await storeTokens(data.accessToken, data.refreshToken);
      setToken(data.accessToken);
      if (data.user) {
        setUser(data.user);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  // Load stored token on mount
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (storedToken) {
          setToken(storedToken);
          try {
            const res = await fetch(`${API_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            if (res.ok) {
              const data = await res.json();
              setUser(data.user);
            } else {
              const refreshed = await refreshAuth();
              if (!refreshed) {
                await clearTokens();
                setToken(null);
              }
            }
          } catch {
            // Backend unavailable, keep token for offline
          }
        }
      } catch {
        // Storage error
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshAuth]);

  // Proactive refresh every 12 minutes
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      refreshAuth();
    }, 12 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token, refreshAuth]);

  const signIn = useCallback(
    async (accessToken: string, refreshToken: string, userData: UserData) => {
      await storeTokens(accessToken, refreshToken);
      setToken(accessToken);
      setUser(userData);
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_KEY);
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {});
      }
    } finally {
      await clearTokens();
      setToken(null);
      setUser(null);
    }
  }, [token]);

  const updateUser = useCallback((data: Partial<UserData>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        signIn,
        signOut,
        refreshAuth,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
