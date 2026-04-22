import { View, Text, Pressable, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User, Star, ChevronRight, LogOut,
  List, Heart, Settings, HelpCircle, Info, type LucideIcon
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import EmptyState from "@/components/ui/EmptyState";

const MENU_ITEMS: { id: string; Icon: LucideIcon; label: string; badge: string | null }[] = [
  { id: "listings", Icon: List, label: "My Listings", badge: "12" },
  { id: "favorites", Icon: Heart, label: "Favorites", badge: "5" },
  { id: "settings", Icon: Settings, label: "Settings", badge: null },
  { id: "help", Icon: HelpCircle, label: "Help & Support", badge: null },
  { id: "about", Icon: Info, label: "About", badge: null },
];

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <ResponsiveContainer>
        {/* Profile Header */}
        <View className="items-center pt-6 pb-8 border-b border-gray-100">
          <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-3">
            <User size={32} color="#3b82f6" />
          </View>
          <Text className="text-xl font-bold text-gray-900">John Doe</Text>
          <Text className="text-sm text-gray-500 mt-0.5">john@example.com</Text>

          {/* Rating */}
          <View className="flex-row items-center mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={14}
                color="#f59e0b"
                fill={star <= 4 ? "#f59e0b" : "none"}
              />
            ))}
            <Text className="text-sm text-gray-500 ml-1.5">4.5 (23 reviews)</Text>
          </View>

          {/* Stats */}
          <View className={`flex-row mt-4${isDesktop ? " border border-border rounded-xl px-4 py-2 bg-white" : ""}`}>
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
          {MENU_ITEMS.length === 0 ? (
            <EmptyState icon={List} title="Нет разделов" subtitle="Разделы профиля недоступны" />
          ) : (
            MENU_ITEMS.map((item) => (
              <Pressable
                accessibilityRole="button"
                key={item.id}
                accessibilityLabel={item.label}
                className="flex-row items-center px-4 py-4 active:bg-gray-50"
              >
                <View className="w-10 h-10 rounded-lg bg-gray-100 items-center justify-center">
                  <item.Icon size={18} color={colors.textSecondary} />
                </View>
                <Text className="flex-1 ml-3 text-base text-gray-900">{item.label}</Text>
                {item.badge && (
                  <View className="bg-blue-100 rounded-full px-2.5 py-0.5 mr-2">
                    <Text className="text-xs font-medium text-blue-600">{item.badge}</Text>
                  </View>
                )}
                <ChevronRight size={12} color={colors.textSecondary} />
              </Pressable>
            ))
          )}
        </View>

        {/* Logout */}
        <View className="mt-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Выйти"
            onPress={signOut}
            className="flex-row items-center justify-center h-12 rounded-xl border border-red-200 active:bg-red-50"
          >
            <LogOut size={16} color={colors.error} />
            <Text className="text-base font-medium text-red-500 ml-2">Log out</Text>
          </Pressable>
        </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
