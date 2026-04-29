import { Redirect } from "expo-router";

/**
 * STRUCT-1 — legacy /(tabs)/create route redirects to the actual
 * request-creation form. Kept as a file so any deep-linked or bookmarked
 * URL continues to work without a 404.
 */
export default function CreateRedirect() {
  return <Redirect href={"/requests/new" as never} />;
}
