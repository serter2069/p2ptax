import { Redirect } from "expo-router";

/**
 * Iter11 PR 2 — legacy redirect. Use /(tabs)/public-requests instead.
 */
export default function SpecialistRequestsRedirect() {
  return <Redirect href={"/(tabs)/public-requests" as never} />;
}
