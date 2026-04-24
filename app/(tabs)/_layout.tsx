import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";
import { Home, Search, PlusSquare, MessageCircle, User } from "lucide-react-native";
import Header from "@/components/Header";
import { colors, fontSizeValue } from "@/lib/theme";

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  // NOTE (iter8 regression fix): we previously suppressed `Header` on desktop
  // web (>=1024px) assuming the AppShell sidebar would carry navigation — but
  // `/(tabs)` reports pathname `/` to `usePathname()`, which is excluded from
  // both the sidebar group detection (`detectSidebarGroup`) and the AppHeader
  // gate (`shouldShowAppHeader`). Suppressing Header left authenticated users
  // with zero chrome on the root marketplace tab. Render Header always.

  return (
    <>
      <Header />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            display: isMobile ? "flex" : "none",
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarLabelStyle: {
            fontSize: fontSizeValue.tabBar,
            fontWeight: "500",
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Home size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color }) => <Search size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: "Create",
            tabBarIcon: ({ color }) => <PlusSquare size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <User size={22} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
