import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";
import { useState, useEffect } from "react";
import {
  FileText,
  Inbox,
  MessageCircle,
  User,
} from "lucide-react-native";
import { colors, fontSizeValue, BREAKPOINT } from "@/lib/theme";
import { apiGet } from "@/lib/api";

/**
 * Unified (tabs) navigator — task #1615 nav split.
 *
 * Mobile tabs (5): Заявки (public bourse) / Мои заявки / Сообщения / Настройки.
 * "Заявки" = open public requests feed (visible to all users).
 * "Мои заявки" = current user's own requests (auth required).
 *
 * The legacy `public-requests` screen is hidden from the tab bar
 * (href: null) — its logic moved into `requests.tsx`.
 *
 * Tab bar is hidden on desktop (≥768px) — SidebarNav carries navigation there.
 */
export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isMobile = width < BREAKPOINT;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = () => {
      apiGet<{ count: number }>("/api/messages/unread-count")
        .then((data) => setUnreadCount(data.count))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: isMobile
          ? {
              height: 60,
              paddingBottom: 8,
              paddingTop: 6,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }
          : { display: "none" },
        tabBarLabelStyle: {
          fontSize: fontSizeValue.tabBar,
          lineHeight: 14,
          fontWeight: "500",
          marginTop: 2,
          flexShrink: 1,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ href: null }} />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Заявки",
          tabBarIcon: ({ color, size }) => <Inbox size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-requests"
        options={{
          title: "Мои заявки",
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Сообщения",
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
          tabBarBadge: unreadCount > 0 ? (unreadCount > 9 ? "9+" : unreadCount) : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Настройки",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      {/* Hidden — legacy specialist public-requests screen, logic moved into `requests`. */}
      <Tabs.Screen name="public-requests" options={{ href: null }} />
      {/* STRUCT-1 — redirect-only tabs, hidden from tab bar. */}
      <Tabs.Screen name="create" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}
