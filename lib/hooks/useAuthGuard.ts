import { useEffect } from "react";
import { useTypedRouter } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function useAuthGuard(opts?: { allowAnonymous?: boolean }) {
  const { isAuthenticated, isLoading } = useAuth();
  const nav = useTypedRouter();

  useEffect(() => {
    if (isLoading) return;
    if (opts?.allowAnonymous) return;
    if (!isAuthenticated) nav.replaceRoutes.login();
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading };
}
