import { Redirect } from "expo-router";

/**
 * Iter11 PR 2 — legacy redirect. Use /(tabs)/messages instead.
 */
export default function ClientMessagesRedirect() {
  return <Redirect href={"/(tabs)/messages" as never} />;
}
