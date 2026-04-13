import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';

// ---------------------------------------------------------------------------
// Types matching the API response (Ifns with included city)
// ---------------------------------------------------------------------------
export interface CityItem {
  id: string;
  name: string;
  slug: string;
  region: string | null;
}

export interface FnsOfficeItem {
  id: string;
  code: string;
  name: string;
  slug: string;
  address: string | null;
  searchAliases: string | null;
  cityId: string;
  city: CityItem;
}

// ---------------------------------------------------------------------------
// Simple in-memory cache (survives re-renders across screens)
// ---------------------------------------------------------------------------
const cache = {
  cities: null as CityItem[] | null,
  citiesPromise: null as Promise<CityItem[]> | null,
  fnsByCity: new Map<string, FnsOfficeItem[]>(),
  fnsByCityPromise: new Map<string, Promise<FnsOfficeItem[]>>(),
  allFns: null as FnsOfficeItem[] | null,
  allFnsPromise: null as Promise<FnsOfficeItem[]> | null,
};

// ---------------------------------------------------------------------------
// Hook: useCities
// ---------------------------------------------------------------------------
export function useCities() {
  const [cities, setCities] = useState<CityItem[]>(cache.cities ?? []);
  const [loading, setLoading] = useState(!cache.cities);

  useEffect(() => {
    if (cache.cities) {
      setCities(cache.cities);
      setLoading(false);
      return;
    }

    let cancelled = false;

    if (!cache.citiesPromise) {
      cache.citiesPromise = api.get<CityItem[]>('/ifns/cities');
    }

    cache.citiesPromise
      .then((data) => {
        cache.cities = data;
        if (!cancelled) {
          setCities(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { cities, loading };
}

// ---------------------------------------------------------------------------
// Hook: useFnsOffices — optionally filtered by cityId
// ---------------------------------------------------------------------------
export function useFnsOffices(cityId?: string) {
  const [offices, setOffices] = useState<FnsOfficeItem[]>(
    cityId ? (cache.fnsByCity.get(cityId) ?? []) : (cache.allFns ?? []),
  );
  const [loading, setLoading] = useState(
    cityId ? !cache.fnsByCity.has(cityId) : !cache.allFns,
  );

  useEffect(() => {
    let cancelled = false;

    if (cityId) {
      // Filtered by city
      if (cache.fnsByCity.has(cityId)) {
        setOffices(cache.fnsByCity.get(cityId)!);
        setLoading(false);
        return;
      }

      if (!cache.fnsByCityPromise.has(cityId)) {
        cache.fnsByCityPromise.set(
          cityId,
          api.get<FnsOfficeItem[]>(`/ifns?city_id=${encodeURIComponent(cityId)}`),
        );
      }

      cache.fnsByCityPromise
        .get(cityId)!
        .then((data) => {
          cache.fnsByCity.set(cityId, data);
          if (!cancelled) {
            setOffices(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      // All offices
      if (cache.allFns) {
        setOffices(cache.allFns);
        setLoading(false);
        return;
      }

      if (!cache.allFnsPromise) {
        cache.allFnsPromise = api.get<FnsOfficeItem[]>('/ifns');
      }

      cache.allFnsPromise
        .then((data) => {
          cache.allFns = data;
          if (!cancelled) {
            setOffices(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [cityId]);

  return { offices, loading };
}

// ---------------------------------------------------------------------------
// Hook: useFnsSearch — debounced search via API (used for typeahead)
// ---------------------------------------------------------------------------
export function useFnsSearch(query: string, debounceMs = 300) {
  const [results, setResults] = useState<FnsOfficeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(() => {
      api
        .get<FnsOfficeItem[]>(`/ifns/search?q=${encodeURIComponent(trimmed)}`)
        .then((data) => setResults(data))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs]);

  return { results, loading };
}
