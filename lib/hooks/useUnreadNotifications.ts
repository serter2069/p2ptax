import { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { notifications as notifApi } from '../api/endpoints';

const POLL_INTERVAL = 60_000; // 1 minute

export function useUnreadNotifications() {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    try {
      const res = await notifApi.unreadCount();
      setCount(res.data.count);
    } catch {
      // silent
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetch();
      intervalRef.current = setInterval(fetch, POLL_INTERVAL);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [fetch]),
  );

  return { unreadCount: count, refresh: fetch };
}
