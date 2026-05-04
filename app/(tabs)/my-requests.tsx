/**
 * My requests — authenticated client's own request list.
 * Uses RequestsFeed in 'mine' mode: active/closed tabs, no catalog filter.
 */
import RequestsFeed from "@/components/requests/RequestsFeed";
import { useNoIndex } from "@/components/seo/NoIndex";

export default function MyRequests() {
  useNoIndex();
  return (
    <RequestsFeed
      mode="mine"
      title="Мои запросы"
    />
  );
}
