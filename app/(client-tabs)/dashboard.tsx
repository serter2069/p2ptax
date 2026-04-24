import { Redirect } from "expo-router";

/**
 * Iter11 PR 2 — legacy redirect. Use /(tabs) instead.
 */
export default function ClientDashboardRedirect() {
  return <Redirect href={"/(tabs)" as never} />;
}
