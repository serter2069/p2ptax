import { Redirect, useLocalSearchParams } from "expo-router";

/**
 * Legacy redirect: /specialists/[id] → /profile/[id].
 *
 * Public profile lives at /profile/[id] now (since any user can be both
 * client and specialist, the URL no longer pretends one role). This file
 * exists only to keep saved bookmarks and outbound links from older
 * sessions working — every real reference inside the app now points to
 * /profile/[id] directly.
 */
export default function LegacySpecialistRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) return null;
  return <Redirect href={`/profile/${id}` as never} />;
}
