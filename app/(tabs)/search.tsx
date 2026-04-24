import { Redirect } from "expo-router";

/**
 * STRUCT-1 — legacy /(tabs)/search route redirects to the specialists
 * catalog. Kept as a file so any deep-linked or bookmarked URL continues
 * to work without a 404.
 */
export default function SearchRedirect() {
  return <Redirect href={"/specialists" as never} />;
}
