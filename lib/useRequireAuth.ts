import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Redirects unauthenticated users to /auth/email.
 * Returns { user, isLoading, isAuthenticated } for rendering guards.
 */
export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter()
  const nav = useTypedRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      nav.replaceRoutes.authEmail();
    }
  }, [isLoading, isAuthenticated, router]);

  return { user, isLoading, isAuthenticated, ready: !isLoading && isAuthenticated };
}
