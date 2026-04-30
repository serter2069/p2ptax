import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface City {
  id: string;
  name: string;
  slug?: string;
  officesCount?: number;
}

let _cache: City[] | null = null;
let _inflight: Promise<City[]> | null = null;

export function useCities() {
  const [cities, setCities] = useState<City[]>(_cache ?? []);
  const [loading, setLoading] = useState(_cache === null);

  useEffect(() => {
    if (_cache) return;
    if (!_inflight) {
      _inflight = api<{ items: City[] }>("/api/cities", { noAuth: true })
        .then((r) => { _cache = r.items; return r.items; })
        .catch(() => { _inflight = null; return [] as City[]; });
    }
    _inflight.then((items) => { setCities(items); setLoading(false); });
  }, []);

  return { cities, loading };
}
