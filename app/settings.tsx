import { Redirect } from "expo-router";

/**
 * Backward-compat alias — /settings now lives at /profile.
 *
 * Kept so external links, sidebar items, and existing `/settings` deep-links
 * continue to resolve. New code should target `/profile` directly.
 */
export default function SettingsAlias() {
  return <Redirect href="/profile" />;
}
