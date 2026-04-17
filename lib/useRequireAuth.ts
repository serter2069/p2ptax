import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Redirects unauthenticated users to /auth/email.
 * Returns { user, isLoading, isAuthenticated } for rendering guards.
 */
export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/email" as never);
    }
  }, [isLoading, isAuthenticated, router]);

  return { user, isLoading, isAuthenticated, ready: !isLoading && isAuthenticated };
}
