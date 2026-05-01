import { Redirect } from "expo-router";

/**
 * Wave 4 / profile-merged — the standalone onboarding/visibility step has
 * been folded into the merged Profile page (visibility toggle). This stub
 * redirects any deep-link or stale push to the new entry point.
 */
export default function OnboardingVisibilityRedirect() {
  return <Redirect href="/profile?firstTime=true&focus=visibility" />;
}

/**
 * Legacy AsyncStorage key kept for back-compat. Old code paths read it; the
 * merged Profile no longer writes to it but harmless leftover values are OK.
 */
export const ONBOARDING_VISIBILITY_KEY = "onboarding_is_public_profile";
