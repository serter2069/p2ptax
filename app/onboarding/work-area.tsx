import { Redirect } from "expo-router";

/**
 * Wave 4 / profile-merged — the standalone onboarding/work-area step has
 * been folded into the merged Profile page (specialist section). This stub
 * redirects any deep-link or stale push to the new entry point.
 */
export default function OnboardingWorkAreaRedirect() {
  return <Redirect href="/profile?firstTime=true&focus=specialist" />;
}
