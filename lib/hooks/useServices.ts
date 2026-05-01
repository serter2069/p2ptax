import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface Service { id: string; name: string; }

let _cache: Service[] | null = null;
let _inflight: Promise<Service[]> | null = null;

export function useServices() {
  const [services, setServices] = useState<Service[]>(_cache ?? []);
  const [loading, setLoading] = useState(_cache === null);

  useEffect(() => {
    if (_cache) return;
    if (!_inflight) {
      _inflight = api<{ items: Service[] }>("/api/services", { noAuth: true })
        .then((r) => { _cache = r.items; return r.items; })
        .catch(() => { _inflight = null; return [] as Service[]; });
    }
    _inflight.then((items) => { setServices(items); setLoading(false); });
  }, []);

  return { services, loading };
}
