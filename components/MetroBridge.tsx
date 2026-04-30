import { useEffect } from "react";
import { usePathname } from "expo-router";

const ERROR_PATTERNS = [
  /не удалось/i, /ошибка/i, /не найдено/i, /недоступно/i, /повторить/i,
  /failed to/i, /error/i, /not found/i, /unavailable/i, /try again/i,
  /something went wrong/i, /unable to/i, /cannot load/i, /загрузк.*не удалась/i,
];

function postToParent(msg: object) {
  if (typeof window !== "undefined" && window.parent !== window) {
    window.parent.postMessage(msg, "*");
  }
}

function scanDomForErrors(path: string) {
  if (typeof document === "undefined") return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set<string>();
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const text = node.textContent?.trim();
    if (!text || text.length < 4 || text.length > 200) continue;
    const el = node.parentElement;
    if (!el) continue;
    // skip hidden elements
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;
    if (ERROR_PATTERNS.some((re) => re.test(text)) && !seen.has(text)) {
      seen.add(text);
      postToParent({ type: "metro-map:runtime-error", path, text, source: "dom" });
    }
  }
}

export default function MetroBridge() {
  const pathname = usePathname();

  useEffect(() => {
    postToParent({ type: "metro-map:route", path: pathname });
  }, [pathname]);

  // Scan DOM for visible error text after each navigation
  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;
    const timer = setTimeout(() => scanDomForErrors(pathname), 1500);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;
    const w = window as unknown as {
      __metroMapPatched?: boolean;
      fetch: typeof fetch;
      onerror: OnErrorEventHandler;
      onunhandledrejection: ((e: PromiseRejectionEvent) => void) | null;
    };
    if (w.__metroMapPatched) return;
    w.__metroMapPatched = true;

    // Patch fetch
    const orig = (w.fetch as typeof fetch).bind(w);
    w.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.toString()
          : (input as Request).url;
      const method = (
        init?.method ||
        (typeof input !== "string" && !(input instanceof URL) ? (input as Request).method : "GET") ||
        "GET"
      ).toUpperCase();
      const startedAt = Date.now();
      try {
        const res = await orig(input as RequestInfo, init);
        postToParent({
          type: "metro-map:network",
          path: location.pathname,
          url, method,
          status: res.status,
          ms: Date.now() - startedAt,
          at: startedAt,
        });
        return res;
      } catch (e) {
        postToParent({
          type: "metro-map:network",
          path: location.pathname,
          url, method,
          status: 0,
          error: (e as Error)?.message || "fetch-failed",
          ms: Date.now() - startedAt,
          at: startedAt,
        });
        throw e;
      }
    };

    // Intercept console.error (dev only — metro-map bridge)
    if (__DEV__) {
      const origError = console.error.bind(console);
      console.error = (...args: unknown[]) => {
        origError(...args);
        const text = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ").slice(0, 300);
        postToParent({ type: "metro-map:runtime-error", path: location.pathname, text, source: "console.error" });
      };
    }

    // Global JS errors
    w.onerror = (msg, _src, _line, _col, err) => {
      const text = (err?.message || String(msg)).slice(0, 300);
      postToParent({ type: "metro-map:runtime-error", path: location.pathname, text, source: "onerror" });
    };

    // Unhandled promise rejections
    w.onunhandledrejection = (e: PromiseRejectionEvent) => {
      const text = (e.reason?.message || String(e.reason)).slice(0, 300);
      postToParent({ type: "metro-map:runtime-error", path: location.pathname, text, source: "unhandledrejection" });
    };
  }, []);

  return null;
}
