import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";
import {
  LayoutGrid,
  FileText,
  MessageCircle,
  Inbox,
  User,
} from "lucide-react-native";
import { colors, fontSizeValue } from "@/lib/theme";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Unified (tabs) navigator — iter11 UI layer (PR 2/3).
 *
 * Replaces the split (client-tabs)/(specialist-tabs) groups. A single set of
 * tabs is rendered; the "Публичные заявки" tab is conditional on
 * {@link useAuth} `isSpecialistUser`.
 *
 * Tabs are hidden on desktop web — {@link SidebarNav} carries navigation
 * there. Mobile keeps the bottom-tab pattern.
 */
export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const { isSpecialistUser } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: isMobile
          ? {
              height: 72,
              paddingBottom: 10,
              paddingTop: 8,
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
        name="index"
        options={{
          title: "Дашборд",
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
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
        }}
      />
      <Tabs.Screen
        name="public-requests"
        options={{
          title: "Публичные заявки",
          tabBarIcon: ({ color, size }) => <Inbox size={size} color={color} />,
          // Hide tab entry entirely when user has no specialist opt-in.
          href: isSpecialistUser ? "/(tabs)/public-requests" : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Настройки",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      {/* STRUCT-1 — redirect-only tabs, hidden from tab bar. */}
      <Tabs.Screen name="create" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}
