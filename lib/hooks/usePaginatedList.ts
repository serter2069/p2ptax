/**
 * Generic infinite-scroll pagination hook.
 *
 * Usage example:
 * ```ts
 * const { data, loading, loadingMore, refreshing, hasMore, error, loadMore, refresh } =
 *   usePaginatedList<RequestItem>(
 *     ({ page, limit }) => api.get(`/requests?page=${page}&limit=${limit}`),
 *     { limit: 20 },
 *   );
 * ```
 * The fetchFn must return { data: T[], total: number, page: number, hasMore: boolean }.
 * Pass the returned props to <PaginatedList /> or wire into FlatList manually.
 */
import { useState, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface PaginatedFetchParams {
  page: number;
  limit: number;
  [key: string]: unknown;
}

export interface UsePaginatedListOptions {
  /** Items per page (default 20) */
  limit?: number;
  /** Extra params merged into every fetch call */
  extraParams?: Record<string, unknown>;
}

export interface UsePaginatedListReturn<T> {
  data: T[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  reset: () => void;
}

type FetchFn<T> = (params: PaginatedFetchParams) => Promise<PaginatedResponse<T>>;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function usePaginatedList<T extends { id: string }>(
  fetchFn: FetchFn<T>,
  options: UsePaginatedListOptions = {},
): UsePaginatedListReturn<T> {
  const { limit = 20, extraParams } = options;

  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  // -------------------------------------------------------------------------
  // Core fetch
  // -------------------------------------------------------------------------
  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (replace) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const result = await fetchFn({ page: pageNum, limit, ...extraParams });

        if (replace) {
          setData(result.data);
        } else {
          // Deduplicate by id
          setData((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const newItems = result.data.filter((item) => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
        }

        setTotal(result.total);
        setHasMore(result.hasMore);
        pageRef.current = result.page;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load data';
        setError(message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [fetchFn, limit, extraParams],
  );

  // -------------------------------------------------------------------------
  // Public methods
  // -------------------------------------------------------------------------
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || isFetchingRef.current) return;
    fetchPage(pageRef.current + 1, false);
  }, [loadingMore, hasMore, fetchPage]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    pageRef.current = 1;
    fetchPage(1, true);
  }, [fetchPage]);

  const reset = useCallback(() => {
    pageRef.current = 1;
    setData([]);
    setTotal(0);
    setHasMore(false);
    setError(null);
    fetchPage(1, true);
  }, [fetchPage]);

  return {
    data,
    total,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    loadMore,
    refresh,
    reset,
  };
}
