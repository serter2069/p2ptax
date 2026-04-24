import { Redirect } from "expo-router";

/**
 * Iter11 PR 2 — profile tab is now a thin redirect to the unified settings
 * page. The settings screen carries personal-data, notification, specialist
 * toggle, and account sections in a single progressive form.
 */
export default function ProfileTab() {
  return <Redirect href={"/settings" as never} />;
}
