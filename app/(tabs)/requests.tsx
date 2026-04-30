/**
 * Public requests bourse — visible to everyone (auth and anon).
 * #1615: primary "Заявки" tab, replacing the prior client "My Requests" placement.
 * Personal feed lives at (tabs)/my-requests.
 */
import RequestsFeed from "@/components/requests/RequestsFeed";

export default function PublicRequestsTab() {
  return (
    <RequestsFeed
      mode="catalog"
      title="Биржа запросов"
      subtitle="Открытая биржа: задайте вопрос — получите предложения от специалистов"
    />
  );
}
