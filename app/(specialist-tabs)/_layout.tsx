import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";
import { LayoutGrid, List, MessageCircle, Rocket } from "lucide-react-native";
import { colors } from "@/lib/theme";

export default function SpecialistTabsLayout() {
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
        tabBarLabelStyle: { fontSize: 12 },
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
          title: "Public Requests",
          tabBarIcon: ({ color, size }) => <List size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="threads"
        options={{
          title: "My Threads",
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="promotion"
        options={{
          title: "Продвижение",
          tabBarIcon: ({ color, size }) => <Rocket size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
