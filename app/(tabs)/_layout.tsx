import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";
import {
  LayoutGrid,
  FileText,
  MessageCircle,
  User,
} from "lucide-react-native";
import { colors, fontSizeValue, BREAKPOINT } from "@/lib/theme";

/**
 * Unified (tabs) navigator — task #1379 cleanup.
 *
 * Exactly 4 tabs on mobile: Главная / Заявки / Сообщения / Настройки.
 * "Публичные заявки" is hidden from the tab bar (href: null) — accessible
 * via the mobile drawer / sidebar only.
 *
 * Tab bar is hidden on desktop (≥768px) — SidebarNav carries navigation there.
 */
export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isMobile = width < BREAKPOINT;

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
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Главная",
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Заявки",
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Сообщения",
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Настройки",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      {/* Hidden from tab bar — accessible via mobile drawer / sidebar. */}
      <Tabs.Screen name="public-requests" options={{ href: null }} />
      {/* STRUCT-1 — redirect-only tabs, hidden from tab bar. */}
      <Tabs.Screen name="create" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}
