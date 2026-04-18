import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";

const MENU_ITEMS = [
  { id: "listings", icon: "list-ul" as const, label: "My Listings", badge: "12" },
  { id: "favorites", icon: "heart-o" as const, label: "Favorites", badge: "5" },
  { id: "settings", icon: "cog" as const, label: "Settings", badge: null },
  { id: "help", icon: "question-circle-o" as const, label: "Help & Support", badge: null },
  { id: "about", icon: "info-circle" as const, label: "About", badge: null },
];

export default function ProfileScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Profile Header */}
        <View className="items-center pt-6 pb-8 border-b border-gray-100">
          <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-3">
            <FontAwesome name="user" size={32} color="#3b82f6" />
          </View>
          <Text className="text-xl font-bold text-gray-900">John Doe</Text>
          <Text className="text-sm text-gray-500 mt-0.5">john@example.com</Text>

          {/* Rating */}
          <View className="flex-row items-center mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <FontAwesome
                key={star}
                name={star <= 4 ? "star" : "star-half-empty"}
                size={14}
                color="#f59e0b"
              />
            ))}
            <Text className="text-sm text-gray-500 ml-1.5">4.5 (23 reviews)</Text>
          </View>

          {/* Stats */}
          <View className="flex-row mt-4">
            <View className="items-center px-6">
              <Text className="text-lg font-bold text-gray-900">12</Text>
              <Text className="text-xs text-gray-500">Listings</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center px-6">
              <Text className="text-lg font-bold text-gray-900">47</Text>
              <Text className="text-xs text-gray-500">Sold</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center px-6">
              <Text className="text-lg font-bold text-gray-900">2y</Text>
              <Text className="text-xs text-gray-500">Member</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="mt-4">
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.id}
              accessibilityLabel={item.label}
              className="flex-row items-center px-4 py-4 active:bg-gray-50"
            >
              <View className="w-10 h-10 rounded-lg bg-gray-100 items-center justify-center">
                <FontAwesome name={item.icon} size={18} color="#4b5563" />
              </View>
              <Text className="flex-1 ml-3 text-base text-gray-900">{item.label}</Text>
              {item.badge && (
                <View className="bg-blue-100 rounded-full px-2.5 py-0.5 mr-2">
                  <Text className="text-xs font-medium text-blue-600">{item.badge}</Text>
                </View>
              )}
              <FontAwesome name="chevron-right" size={12} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <View className="mt-4 px-4">
          <Pressable
            accessibilityLabel="Выйти"
            onPress={signOut}
            className="flex-row items-center justify-center h-12 rounded-xl border border-red-200 active:bg-red-50"
          >
            <FontAwesome name="sign-out" size={16} color={colors.error} />
            <Text className="text-base font-medium text-red-500 ml-2">Log out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
