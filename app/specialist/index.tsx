import { Redirect } from "expo-router";

/**
 * Wave 6 / profile-tabs — /specialist consolidated into a tab on
 * /profile. This stub exists only so old links / sidebar items still
 * land somewhere meaningful. The Redirect uses replace so the user
 * doesn't get a /specialist entry in their browser history.
 */
export default function SpecialistRedirect() {
  return <Redirect href="/profile?tab=specialist" />;
}
