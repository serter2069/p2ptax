import { useEffect } from "react";
import { useTypedRouter } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function useAuthGuard(opts?: { allowAnonymous?: boolean; returnTo?: string }) {
  const { isAuthenticated, isLoading } = useAuth();
  const nav = useTypedRouter();

  useEffect(() => {
    if (isLoading) return;
    if (opts?.allowAnonymous) return;
    if (!isAuthenticated) {
      if (opts?.returnTo) {
        nav.replaceAny({ pathname: "/login", params: { returnTo: opts.returnTo } });
      } else {
        nav.replaceRoutes.login();
      }
    }
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading };
}
