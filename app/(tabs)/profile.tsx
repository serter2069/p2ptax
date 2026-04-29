import UnifiedSettings from "@/app/settings/index";

/**
 * Profile tab — renders the unified settings screen inline so the tab bar
 * remains visible. Previously used <Redirect href="/settings" /> which
 * pushed a Stack screen outside (tabs), causing the tab bar to disappear.
 */
export default function ProfileTab() {
  return <UnifiedSettings />;
}
