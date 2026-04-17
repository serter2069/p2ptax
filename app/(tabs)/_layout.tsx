import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Header from "@/components/Header";

function TabIcon({ name, color }: { name: React.ComponentProps<typeof FontAwesome>["name"]; color: string }) {
  return <FontAwesome size={22} name={name} color={color} />;
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;

  return (
    <>
      <Header />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#2563eb",
          tabBarInactiveTintColor: "#9ca3af",
          tabBarStyle: {
            display: isMobile ? "flex" : "none",
            borderTopWidth: 1,
            borderTopColor: "#f3f4f6",
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color }) => <TabIcon name="search" color={color} />,
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: "Create",
            tabBarIcon: ({ color }) => <TabIcon name="plus-square" color={color} />,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            tabBarIcon: ({ color }) => <TabIcon name="comments" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
