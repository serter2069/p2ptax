import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";
import { LayoutGrid, FileText, MessageCircle } from "lucide-react-native";
import { colors, fontSizeValue } from "@/lib/theme";

export default function ClientTabsLayout() {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isMobile
          ? { height: 60, paddingBottom: 8, borderTopColor: colors.border }
          : { display: "none" },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.placeholder,
        tabBarLabelStyle: { fontSize: fontSizeValue.tabBar },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "My Requests",
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
