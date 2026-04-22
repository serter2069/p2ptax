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
    <SafeAreaView className="flex-1 bg-surface2">
      <ScrollView className="flex-1" contentContainerClassName="pb-10">
        <ResponsiveContainer>
          {/* Profile Header Card */}
          <View className="bg-white mx-4 mt-6 rounded-2xl border border-border px-6 py-8 items-center mb-4">
            {/* Avatar */}
            <View className="w-20 h-20 rounded-full bg-accent-soft items-center justify-center mb-3">
              <User size={32} color={colors.accent} />
            </View>
            <Text className="text-xl font-bold text-text-base mt-1">John Doe</Text>
            <Text className="text-sm text-text-mute mt-1">john@example.com</Text>

            {/* Rating */}
            <View className="flex-row items-center mt-2.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  color="#f59e0b"
                  fill={star <= 4 ? "#f59e0b" : "none"}
                />
              ))}
              <Text className="text-sm text-text-mute ml-1.5">4.5 (23 reviews)</Text>
            </View>

            {/* Stats */}
            <View
              className={`flex-row mt-5 border border-border rounded-xl overflow-hidden${isDesktop ? " px-2 py-1 bg-white" : ""}`}
            >
              <View className="items-center px-6 py-2">
                <Text className="text-lg font-bold text-text-base">12</Text>
                <Text className="text-xs text-text-mute mt-0.5">Listings</Text>
              </View>
              <View className="w-px bg-border" />
              <View className="items-center px-6 py-2">
                <Text className="text-lg font-bold text-text-base">47</Text>
                <Text className="text-xs text-text-mute mt-0.5">Sold</Text>
              </View>
              <View className="w-px bg-border" />
              <View className="items-center px-6 py-2">
                <Text className="text-lg font-bold text-text-base">2y</Text>
                <Text className="text-xs text-text-mute mt-0.5">Member</Text>
              </View>
            </View>
          </View>

          {/* Section label */}
          <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider px-4 mb-2 mt-2">
            Menu
          </Text>

          {/* Menu Items Card */}
          <View className="bg-white mx-4 rounded-2xl border border-border overflow-hidden mb-4">
            {MENU_ITEMS.length === 0 ? (
              <EmptyState icon={List} title="Нет разделов" subtitle="Разделы профиля недоступны" />
            ) : (
              MENU_ITEMS.map((item, index) => (
                <Pressable
                  accessibilityRole="button"
                  key={item.id}
                  accessibilityLabel={item.label}
                  className={`flex-row items-center px-4 py-3.5 min-h-[50px] active:bg-surface2${
                    index < MENU_ITEMS.length - 1 ? " border-b border-border" : ""
                  }`}
                >
                  <View className="w-9 h-9 rounded-xl bg-accent-soft items-center justify-center">
                    <item.Icon size={17} color={colors.accent} />
                  </View>
                  <Text className="flex-1 ml-3 text-base font-medium text-text-base">{item.label}</Text>
                  {item.badge && (
                    <View className="bg-accent-soft rounded-full px-2.5 py-0.5 mr-2">
                      <Text className="text-xs font-semibold text-accent">{item.badge}</Text>
                    </View>
                  )}
                  <ChevronRight size={16} color={colors.textMuted} />
                </Pressable>
              ))
            )}
          </View>

          {/* Account section */}
          <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider px-4 mb-2">
            Account
          </Text>

          {/* Logout Card */}
          <View className="bg-white mx-4 rounded-2xl border border-border overflow-hidden mb-4">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Выйти"
              onPress={signOut}
              className="flex-row items-center px-4 py-3.5 min-h-[50px] active:bg-danger-soft"
            >
              <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: colors.dangerSoft }}>
                <LogOut size={17} color={colors.danger} />
              </View>
              <Text className="flex-1 ml-3 text-base font-medium text-danger">Log out</Text>
            </Pressable>
          </View>

          <Text className="text-xs text-text-dim text-center mt-2 mb-4">Version 1.0.0</Text>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
