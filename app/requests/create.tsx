import { Redirect } from "expo-router";

/**
 * #1518 — legacy /requests/create route. The canonical create-request
 * screen lives at /requests/new. This file remains as a redirect so any
 * deep-linked or bookmarked URL continues to work without a 404.
 */
export default function CreateRequestRedirect() {
  return <Redirect href={"/requests/new" as never} />;
}
