import { Redirect } from "expo-router";

/**
 * Wave 4 / profile-merged — the standalone onboarding/profile step has been
 * folded into the merged Profile page. This stub redirects any deep-link or
 * stale push to the new entry point.
 */
export default function OnboardingProfileRedirect() {
  return <Redirect href="/profile?firstTime=true" />;
}
