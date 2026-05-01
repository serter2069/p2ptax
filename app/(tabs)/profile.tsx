import UnifiedProfile from "@/app/profile/index";

/**
 * Profile tab — renders the unified profile screen inline so the tab bar
 * remains visible. Previously used <Redirect href="/settings" /> which
 * pushed a Stack screen outside (tabs), causing the tab bar to disappear.
 *
 * Wave 4 / profile-merged: /settings was renamed to /profile and the
 * onboarding screens were folded into it; this tab keeps a stable mount.
 */
export default function ProfileTab() {
  return <UnifiedProfile />;
}
