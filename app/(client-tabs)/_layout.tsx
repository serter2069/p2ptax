import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function ClientTabsLayout() {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isMobile
          ? { height: 60, paddingBottom: 8, borderTopColor: "#e2e8f0" }
          : { display: "none" },
        tabBarActiveTintColor: "#1e3a8a",
        tabBarInactiveTintColor: "#94a3b8",
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
          title: "My Requests",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="file-text-o" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="comments-o" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
