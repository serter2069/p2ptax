// #1615 — public-requests was the specialist's bourse view; its logic moved
// into (tabs)/requests.tsx so every user sees the same public feed by default.
// This file now exists only as a redirect for legacy bookmarks/links.
import { Redirect } from "expo-router";

export default function PublicRequestsLegacyRedirect() {
  return <Redirect href={"/(tabs)/requests" as never} />;
}
