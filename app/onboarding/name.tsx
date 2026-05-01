import { Redirect } from "expo-router";

/**
 * Wave 4 / profile-merged — the standalone onboarding/name step has been
 * folded into the merged Profile page. This stub redirects any deep-link
 * or stale push to the new entry point and preserves the focus hint.
 */
export default function OnboardingNameRedirect() {
  return <Redirect href="/profile?firstTime=true&focus=name" />;
}
