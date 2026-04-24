import { Redirect } from "expo-router";

/**
 * Iter11 PR 2 — legacy redirect. All settings live at /settings.
 */
export default function SettingsClientRedirect() {
  return <Redirect href={"/settings" as never} />;
}
