import { Redirect } from "expo-router";

/**
 * Iter11 PR 2 — legacy redirect. Use /(tabs)/requests instead.
 */
export default function ClientRequestsRedirect() {
  return <Redirect href={"/(tabs)/requests" as never} />;
}
