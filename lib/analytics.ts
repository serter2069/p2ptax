import PostHog from "posthog-react-native";

/**
 * Thin product-analytics wrapper around PostHog. Callers import
 * `track / identify / reset` from this module and never touch the
 * PostHog client directly — keeps the vendor surface swappable and
 * the call sites short.
 *
 * Initialization:
 *   - API key: `EXPO_PUBLIC_POSTHOG_KEY` (must be inlined at build time).
 *   - Host:    `EXPO_PUBLIC_POSTHOG_HOST` (default `https://eu.i.posthog.com`
 *              for РФ user data residency).
 *
 * Graceful no-op: if the key is missing the module exports stub functions
 * so dev without keys keeps running silently. We log a single warning so
 * the omission is visible during local boot.
 */

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

let client: PostHog | null = null;
let warned = false;

function getClient(): PostHog | null {
  if (client) return client;
  if (!POSTHOG_KEY) {
    if (!warned) {
      // eslint-disable-next-line no-console
      console.warn(
        "[analytics] EXPO_PUBLIC_POSTHOG_KEY not set — analytics disabled"
      );
      warned = true;
    }
    return null;
  }
  client = new PostHog(POSTHOG_KEY, {
    host: POSTHOG_HOST,
    // Capture lifecycle events automatically (app open / background) so
    // we can build retention curves without per-screen plumbing.
    captureAppLifecycleEvents: true,
  });
  return client;
}

// Initialize lazily on first call. Calling `getClient()` here would
// instantiate PostHog at module import time, which races with Sentry init
// and pollutes test boot. Lazy init is plenty fast for our volumes.

/**
 * Track an event. No-op when PostHog is not configured.
 *
 * Event-name convention: `domain_action` (`landing_view`, `intake_submit`,
 * `otp_request`). Props are flat key→primitive maps; nested objects flatten
 * server-side and become hard to query in PostHog Insights.
 */
export function track(
  event: string,
  props?: Record<string, unknown>
): void {
  const c = getClient();
  if (!c) return;
  try {
    // PostHog's `PostHogEventProperties` requires JSON-serialisable values.
    // Our public surface accepts `unknown` for ergonomics; PostHog stringifies
    // non-JSON values internally. Cast is safe because of that fallback.
    c.capture(event, props as Record<string, never> | undefined);
  } catch (err) {
    // Never let analytics break the UI thread.
    // eslint-disable-next-line no-console
    console.warn("[analytics] capture failed", err);
  }
}

/**
 * Bind subsequent events to a user. Call after successful sign-in. Safe to
 * call repeatedly with the same id (PostHog dedupes).
 */
export function identify(
  userId: string,
  props?: Record<string, unknown>
): void {
  const c = getClient();
  if (!c) return;
  try {
    c.identify(userId, props as Record<string, never> | undefined);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[analytics] identify failed", err);
  }
}

/**
 * Forget the current user. Call on sign-out so the next session starts a
 * fresh anonymous trail.
 */
export function reset(): void {
  const c = getClient();
  if (!c) return;
  try {
    c.reset();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[analytics] reset failed", err);
  }
}

/**
 * Returns `true` if PostHog is configured. Useful for tests / dev banners
 * that want to indicate analytics state.
 */
export function isAnalyticsEnabled(): boolean {
  return !!POSTHOG_KEY;
}
