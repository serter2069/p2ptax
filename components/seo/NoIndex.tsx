import { useEffect } from "react";
import Head from "expo-router/head";

const TAGS = [
  { name: "robots", content: "noindex, nofollow" },
  { name: "googlebot", content: "noindex, nofollow" },
  { name: "bingbot", content: "noindex, nofollow" },
] as const;

/**
 * `useNoIndex()` — call inside any private/authenticated route's component
 * to add noindex,nofollow meta tags to the document head. Imperative DOM
 * write so callers don't need to wrap JSX in a fragment or worry about
 * where to put a Head component.
 *
 * The cleanup removes the tags on unmount, so a private → public route
 * transition (within the same SPA mount) doesn't leave stale noindex
 * tags behind.
 *
 * Used on: /messages, /threads/:id, /my-requests, /profile (settings),
 * /saved-specialists, /admin/*, /requests/new, /requests/:id/write.
 */
export function useNoIndex() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const created: HTMLMetaElement[] = [];
    for (const t of TAGS) {
      // Skip if some other layer already inserted the tag.
      if (document.head.querySelector(`meta[name="${t.name}"][data-noindex="1"]`)) {
        continue;
      }
      const meta = document.createElement("meta");
      meta.setAttribute("name", t.name);
      meta.setAttribute("content", t.content);
      meta.setAttribute("data-noindex", "1");
      document.head.appendChild(meta);
      created.push(meta);
    }
    return () => {
      for (const m of created) m.remove();
    };
  }, []);
}

/**
 * Component variant — drop into JSX. Renders the same noindex meta tags
 * via expo-router/head. Useful for native (iOS/Android) where the hook
 * approach can't reach a document.
 */
export default function NoIndex() {
  return (
    <Head>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
      <meta name="bingbot" content="noindex, nofollow" />
    </Head>
  );
}
