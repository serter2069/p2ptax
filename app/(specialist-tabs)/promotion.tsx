import { Redirect } from "expo-router";

/**
 * Iter11 PR 2 — legacy redirect. Promotion tab is being re-homed; for the
 * interim, route back to the unified dashboard. PR 3 will decide the
 * final destination (dashboard widget vs dedicated route).
 */
export default function SpecialistPromotionRedirect() {
  return <Redirect href={"/(tabs)" as never} />;
}
