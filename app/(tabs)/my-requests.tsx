/**
 * My requests — authenticated client's own request list.
 * Uses RequestsFeed in 'mine' mode: active/closed tabs, no catalog filter.
 */
import RequestsFeed from "@/components/requests/RequestsFeed";

export default function MyRequests() {
  return (
    <RequestsFeed
      mode="mine"
      title="Мои запросы"
    />
  );
}
