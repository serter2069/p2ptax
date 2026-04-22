import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";
import { BarChart2, Users, Shield, Flag } from "lucide-react-native";
import { colors, fontSizeValue } from "@/lib/theme";

export default function AdminTabsLayout() {
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
          tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="moderation"
        options={{
          title: "Moderation",
          tabBarIcon: ({ color, size }) => <Shield size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: "Жалобы",
          tabBarIcon: ({ color, size }) => <Flag size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
