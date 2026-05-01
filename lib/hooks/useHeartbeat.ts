import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const PING_INTERVAL_MS = 60_000; // 1 min

export function useHeartbeat() {
  const { isAuthenticated } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const ping = () =>
      api("/api/auth/heartbeat", { method: "POST" }).catch(() => {});

    ping(); // immediate ping on mount / auth change
    intervalRef.current = setInterval(ping, PING_INTERVAL_MS);

    const onAppStateChange = (s: AppStateStatus) => {
      if (s === "active") ping();
    };
    const sub = AppState.addEventListener("change", onAppStateChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, [isAuthenticated]);
}
