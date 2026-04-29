import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3812";

const TOKEN_KEY = "p2ptax_access_token";
const REFRESH_KEY = "p2ptax_refresh_token";

/**
 * Iter11 (complete) — role enum: GUEST | USER | ADMIN. Specialist features
 * are opt-in via the `isSpecialist` flag on USER accounts. Callers should
 * use the `isSpecialistUser` / `isClientUser` / `isAdminUser` getters from
 * `useAuth()` instead of `user.role === …` equality checks.
 */
export type UserRole =
  | "GUEST"
  | "USER"
  | "ADMIN"
  | null;

export interface UserData {
  id: string;
  email: string;
  role: UserRole;
  /** Iter11 — specialist opt-in flag. Source of truth for specialist features. */
  isSpecialist?: boolean;
  /** Iter11 — set when specialist onboarding finishes. Null until completed. */
  specialistProfileCompletedAt?: string | null;
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
  /** True when user has specialist features enabled. */
  isSpecialistUser: boolean;
  /**
   * True for any non-admin authenticated user — every USER, specialist or
   * not, is a "client" as far as creating their own tax-help requests goes.
   */
  isClientUser: boolean;
  /** True for ADMIN role holders. */
  isAdminUser: boolean;
  /** Can the user write new threads on public requests? (Requires completed specialist profile.) */
  canWriteThreads: boolean;
  /** Can the user create their own tax-help requests? (All USERs — even specialists — in Iter11.) */
  canCreateRequests: boolean;
  /** Can the user see the public feed of leads? (Specialists only.) */
  canSeePublicFeed: boolean;
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
  isSpecialistUser: false,
  isClientUser: false,
  isAdminUser: false,
  canWriteThreads: false,
  canCreateRequests: false,
  canSeePublicFeed: false,
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

/**
 * Iter11 (complete) — the `isSpecialist` flag is the single source of
 * truth. Returns false for anonymous users and users whose backend payload
 * is missing the flag (defensive; should not occur after PR 1).
 */
function deriveIsSpecialist(user: UserData | null): boolean {
  if (!user) return false;
  return user.isSpecialist === true;
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

  // Web: sync auth state across browser tabs via the `storage` event.
  // The event only fires in OTHER tabs (not the originator), so this is safe
  // from feedback loops. On native this is a no-op (single instance).
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== TOKEN_KEY) return;
      if (!e.newValue) {
        // Logged out in another tab — drop local session.
        setToken(null);
        setUser(null);
      } else if (e.newValue !== token) {
        // New token appeared in another tab — pull fresh user state.
        refreshAuth();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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

  const derived = useMemo(() => {
    const isSpec = deriveIsSpecialist(user);
    const isAdmin = user?.role === "ADMIN";
    // Any authenticated non-admin user can create requests (Iter11 widens the
    // previous CLIENT-only rule — specialists can now file their own too).
    const isClient = !!user && !isAdmin;
    const profileCompleted = !!user?.specialistProfileCompletedAt;
    return {
      isSpecialistUser: isSpec,
      isClientUser: isClient,
      isAdminUser: isAdmin,
      canWriteThreads: isSpec && profileCompleted,
      canCreateRequests: isClient,
      canSeePublicFeed: isSpec,
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        ...derived,
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
