import { useEffect } from "react";
import { useRouter, usePathname, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Redirects unauthenticated users to /login with a `returnTo` param
 * pointing back at the current route, so the user lands back on the
 * intended screen after a successful OTP verify.
 *
 * Issues #1515 / #1520 / #1522 — previously the redirect was silent
 * (no returnTo, no hint), which made deep-links to protected screens
 * (e.g. /onboarding/name) render as /login with no indication that
 * the user was mid-flow. Browsers / password managers therefore
 * treated /login as the canonical destination and the back button
 * left them stranded.
 *
 * `intent` is forwarded when set (e.g. "specialist" from landing CTA)
 * so /otp can route to the correct onboarding branch after login.
 *
 * Returns `{ user, isLoading, isAuthenticated, ready }` for guarding
 * UI render.
 */
export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const nav = useTypedRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ intent?: string }>();
  const intent =
    typeof params.intent === "string"
      ? params.intent
      : Array.isArray(params.intent)
        ? params.intent[0]
        : undefined;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Preserve the originally-requested route so /login + /otp can
      // restore it after auth. Skip preservation for "/" — the
      // landing/dashboard split is handled by /index + role routing.
      const shouldPreserve =
        typeof pathname === "string" && pathname !== "" && pathname !== "/";
      if (shouldPreserve) {
        nav.replaceAny({
          pathname: "/login",
          params: {
            returnTo: pathname as string,
            ...(intent ? { intent } : {}),
          },
        });
      } else {
        nav.replaceRoutes.authEmail();
      }
    }
  }, [isLoading, isAuthenticated, router, pathname, intent]);

  return { user, isLoading, isAuthenticated, ready: !isLoading && isAuthenticated };
}
