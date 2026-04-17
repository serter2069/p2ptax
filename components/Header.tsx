import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import MobileMenu from "./MobileMenu";

const NAV_ITEMS = [
  { label: "Home", route: "/(tabs)" as const, icon: "home" as const },
  { label: "Search", route: "/(tabs)/search" as const, icon: "search" as const },
  { label: "Create", route: "/(tabs)/create" as const, icon: "plus-square" as const },
  { label: "Messages", route: "/(tabs)/messages" as const, icon: "comments" as const },
  { label: "Profile", route: "/(tabs)/profile" as const, icon: "user" as const },
];

export default function Header() {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <View className="flex-row items-center justify-between px-4 h-14 bg-white border-b border-gray-100">
          <Pressable onPress={() => setMenuOpen(true)} className="w-10 h-10 items-center justify-center">
            <FontAwesome name="bars" size={20} color="#374151" />
          </Pressable>

          <Text className="text-lg font-bold text-gray-900">Etalon</Text>

          {isAuthenticated ? (
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => router.push("/notifications" as never)}
                className="w-10 h-10 items-center justify-center"
              >
                <FontAwesome name="bell-o" size={18} color="#374151" />
              </Pressable>
              <Pressable
                onPress={() => router.push("/(tabs)/profile" as never)}
                className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center"
              >
                <Text className="text-sm font-bold text-blue-600">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push("/(auth)/email" as never)}
              className="px-4 h-9 rounded-lg bg-blue-600 items-center justify-center"
            >
              <Text className="text-sm font-semibold text-white">Sign In</Text>
            </Pressable>
          )}
        </View>

        <MobileMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
      </>
    );
  }

  // Desktop header
  return (
    <View className="flex-row items-center justify-between px-6 h-16 bg-white border-b border-gray-100">
      <Pressable onPress={() => router.push("/(tabs)" as never)}>
        <Text className="text-xl font-bold text-blue-600">Etalon</Text>
      </Pressable>

      <View className="flex-row items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route as never)}
            className="flex-row items-center px-4 py-2 rounded-lg active:bg-gray-100"
          >
            <FontAwesome name={item.icon} size={14} color="#6b7280" />
            <Text className="text-sm font-medium text-gray-700 ml-2">{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {isAuthenticated ? (
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.push("/notifications" as never)}
            className="w-10 h-10 rounded-lg items-center justify-center active:bg-gray-100"
          >
            <FontAwesome name="bell-o" size={18} color="#374151" />
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/profile" as never)}
            className="w-9 h-9 rounded-full bg-blue-100 items-center justify-center"
          >
            <Text className="text-sm font-bold text-blue-600">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => router.push("/(auth)/email" as never)}
          className="px-5 h-10 rounded-lg bg-blue-600 items-center justify-center active:bg-blue-700"
        >
          <Text className="text-sm font-semibold text-white">Sign In</Text>
        </Pressable>
      )}
    </View>
  );
}
