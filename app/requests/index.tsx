import Head from "expo-router/head";
/**
 * Public requests bourse — standalone route (deep link / direct navigation).
 * Mirrors the (tabs)/requests tab but includes a back button via RequestsFeed.
 */
import RequestsFeed from "@/components/requests/RequestsFeed";

export default function PublicRequestsFeed() {
  return (
    <>
      <Head>
        <title>Запросы клиентов — каталог | p2ptax</title>
        <meta
          name="description"
          content="Открытая лента запросов от клиентов: ИФНС, описание ситуации, статус. Откликайтесь на актуальные обращения по своей инспекции."
        />
        <meta property="og:title" content="Запросы клиентов — каталог | p2ptax" />
        <meta
          property="og:description"
          content="Открытая лента запросов от клиентов по конкретным ИФНС."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://p2ptax.smartlaunchhub.com/requests" />
      </Head>
    
    <RequestsFeed
      mode="catalog"
      title="Запросы"
    />
    </>
  );
}
