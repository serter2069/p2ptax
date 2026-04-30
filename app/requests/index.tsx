/**
 * Public requests bourse — standalone route (deep link / direct navigation).
 * Mirrors the (tabs)/requests tab but includes a back button via RequestsFeed.
 */
import RequestsFeed from "@/components/requests/RequestsFeed";

export default function PublicRequestsFeed() {
  return (
    <RequestsFeed
      mode="catalog"
      title="Запросы"
    />
  );
}
