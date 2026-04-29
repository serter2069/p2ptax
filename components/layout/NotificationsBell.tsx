import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Bell } from "lucide-react-native";
import { useTypedRouter } from "@/lib/navigation";
import { apiGet } from "@/lib/api";
import { colors } from "@/lib/theme";

/**
 * Notifications bell — header trigger that opens `/notifications` and
 * surfaces an unread badge based on `GET /api/notifications`.
 *
 * The endpoint returns `{ unreadCount, total, ... }`; we use `unreadCount`
 * as the source of truth. Polled every 30s while mounted so the badge
 * stays roughly in sync without a websocket layer.
 */
interface NotificationsResponse {
  unreadCount?: number;
  total?: number;
}

const POLL_INTERVAL_MS = 30_000;

export default function NotificationsBell() {
  const nav = useTypedRouter();
  const [unread, setUnread] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await apiGet<NotificationsResponse>(
        "/api/notifications?unreadOnly=true&limit=1"
      );
      // Prefer explicit `unreadCount`; fall back to `total` for older shapes.
      const next =
        typeof res.unreadCount === "number"
          ? res.unreadCount
          : typeof res.total === "number"
            ? res.total
            : 0;
      setUnread(Math.max(0, next));
    } catch {
      // Silent — header bell shouldn't error-block the UI.
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchUnread]);

  const display = unread > 99 ? "99+" : String(unread);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        unread > 0
          ? `Уведомления, непрочитанных: ${display}`
          : "Уведомления"
      }
      onPress={() => nav.any("/notifications")}
      className="items-center justify-center"
      style={{ width: 44, height: 44 }}
    >
      <View style={{ position: "relative" }}>
        <Bell size={20} color={colors.text} />
        {unread > 0 ? (
          <View
            className="rounded-full items-center justify-center"
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              paddingHorizontal: 4,
              backgroundColor: colors.danger,
            }}
          >
            <Text
              style={{
                color: colors.white,
                fontSize: 10,
                fontWeight: "700",
                fontVariant: ["tabular-nums"],
                lineHeight: 12,
              }}
            >
              {display}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
