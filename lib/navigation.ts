/**
 * Typed navigation helper for Expo Router.
 *
 * Eliminates the `as never` casts across the app by providing explicit
 * typed route accessors.  Static routes are listed as string literal
 * constants.  Dynamic routes use factory functions so the path segments
 * are enforced at compile time.
 *
 * Usage:
 *   const nav = useTypedRouter();
 *   nav.routes.login();                    // static
 *   nav.dynamic.thread("abc123");          // dynamic with param
 *   nav.replaceRoutes.home();              // replace instead of push
 *   nav.any("/some-path");                 // freeform fallback
 *   nav.any({ pathname: "/otp", params: { email } });  // with params
 *   nav.back();
 */

import { useRouter } from "expo-router";

// ---------------------------------------------------------------------------
// Static route constants (matches file structure in app/)
// ---------------------------------------------------------------------------

export const ROUTES = {
  // Root
  home: "/",
  login: "/login",
  otp: "/otp",
  brand: "/brand",
  notifications: "/notifications",

  // Tabs (user) — #1615: requests = public bourse, my-requests = personal feed
  tabs: "/(tabs)/my-requests",
  tabsHome: "/(tabs)/my-requests",
  dashboard: "/(tabs)/my-requests",
  tabsRequests: "/(tabs)/requests",
  tabsMyRequests: "/(tabs)/my-requests",
  tabsMessages: "/(tabs)/messages",
  tabsPublicRequests: "/(tabs)/requests",
  tabsCreate: "/(tabs)/create",
  tabsProfile: "/(tabs)/profile",
  tabsSearch: "/(tabs)/search",

  // Admin tabs
  adminDashboard: "/(admin-tabs)/dashboard",
  adminUsers: "/(admin-tabs)/users",
  adminComplaints: "/(admin-tabs)/complaints",
  adminModeration: "/(admin-tabs)/moderation",
  adminSettings: "/admin/settings",

  // Auth / onboarding
  authEmail: "/login",
  onboardingName: "/onboarding/name",
  onboardingVisibility: "/onboarding/visibility",
  onboardingProfile: "/onboarding/profile",
  onboardingWorkArea: "/onboarding/work-area",

  // Requests
  requests: "/requests",
  requestsNew: "/requests/new",

  // Profile (Wave 4 / profile-merged — replaces /settings; alias kept).
  profile: "/profile",
  settings: "/settings",

  // Specialists
  specialists: "/specialists",

  // Legal
  legalIndex: "/legal",
  legalTerms: "/legal/terms",
  legalPrivacy: "/legal/privacy",
} as const;

export type StaticRoute = (typeof ROUTES)[keyof typeof ROUTES];

// ---------------------------------------------------------------------------
// Dynamic route factories — return typed strings
// ---------------------------------------------------------------------------

export const DYNAMIC_ROUTES = {
  /** /requests/:id — alias of requestDetail (kept for backward compatibility). */
  request: (id: string) => `/requests/${id}/detail` as const,

  /** /requests/:id/detail */
  requestDetail: (id: string) => `/requests/${id}/detail` as const,

  /** /requests/:id/write */
  requestWrite: (id: string) => `/requests/${id}/write` as const,

  /** /requests/:id/messages */
  requestMessages: (id: string) => `/requests/${id}/messages` as const,

  /** /threads/:id */
  thread: (id: string) => `/threads/${id}` as const,

  /** /specialists/:id */
  specialist: (id: string) => `/specialists/${id}` as const,

  /** /login?returnTo=... */
  loginWithReturnTo: (returnTo: string) =>
    `/login?returnTo=${encodeURIComponent(returnTo)}` as const,

  /** /specialists?q=... */
  specialistsSearch: (q: string) =>
    `/specialists?q=${encodeURIComponent(q)}` as const,
} as const;

export type DynamicRouteReturn = ReturnType<
  (typeof DYNAMIC_ROUTES)[keyof typeof DYNAMIC_ROUTES]
>;

// ---------------------------------------------------------------------------
// Combined route type
// ---------------------------------------------------------------------------

export type AppRoute = StaticRoute | DynamicRouteReturn | (string & {});

// ---------------------------------------------------------------------------
// Typed Router wrapper
// ---------------------------------------------------------------------------

/**
 * Internal interface for the typed router return value.
 * `any` / `replaceAny` accept `unknown` to delegate the type check
 * to the underlying expo-router `router.push` / `router.replace`.
 */
export function useTypedRouter() {
  const router = useRouter();

  return {
    /** Navigate forward — static named routes */
    routes: Object.fromEntries(
      Object.entries(ROUTES).map(([key, path]) => [
        key,
        () => router.push(path as never),
      ])
    ) as { [K in keyof typeof ROUTES]: () => void },

    /** Navigate forward — dynamic routes with params */
    dynamic: Object.fromEntries(
      Object.entries(DYNAMIC_ROUTES).map(([key, fn]) => [
        key,
        (...args: unknown[]) => router.push((fn as (...a: unknown[]) => string)(...args) as never),
      ])
    ) as {
      [K in keyof typeof DYNAMIC_ROUTES]: (
        ...args: Parameters<(typeof DYNAMIC_ROUTES)[K]>
      ) => void;
    },

    /** Freeform push — forwards to router.push with original type checking */
    any: (target: unknown) => router.push(target as never),

    /** Go back */
    back: () => router.back(),

    /** Navigate forward and replace — static named routes */
    replaceRoutes: Object.fromEntries(
      Object.entries(ROUTES).map(([key, path]) => [
        key,
        () => router.replace(path as never),
      ])
    ) as { [K in keyof typeof ROUTES]: () => void },

    /** Navigate forward and replace — freeform */
    replaceAny: (target: unknown) => router.replace(target as never),
  };
}
