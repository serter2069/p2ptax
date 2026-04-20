import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
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
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="th-large" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Public Requests",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="list-alt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="threads"
        options={{
          title: "My Threads",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="comments-o" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="promotion"
        options={{
          title: "Продвижение",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="rocket" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
