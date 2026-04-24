import { View, Text, Pressable, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User, Star, ChevronRight, LogOut,
  FileText, Heart, Settings, HelpCircle, Info, type LucideIcon
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import EmptyState from "@/components/ui/EmptyState";

// Tax-domain menu items (NOT marketplace listings).
const MENU_ITEMS: { id: string; Icon: LucideIcon; label: string; badge: string | null }[] = [
  { id: "requests", Icon: FileText, label: "Мои заявки", badge: null },
  { id: "saved", Icon: Heart, label: "Сохранённые специалисты", badge: null },
  { id: "settings", Icon: Settings, label: "Настройки", badge: null },
  { id: "help", Icon: HelpCircle, label: "Помощь и поддержка", badge: null },
  { id: "about", Icon: Info, label: "О платформе", badge: null },
];

export default function ProfileScreen() {
  const { signOut, user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email ?? "Пользователь";
  const displayEmail = user?.email ?? "";

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <ScrollView className="flex-1" contentContainerClassName="pb-10">
        <ResponsiveContainer>
          {/* Profile Header Card */}
          <View
            className="bg-white mx-4 mt-6 rounded-2xl border border-border px-6 py-8 items-center mb-4"
            style={{
              shadowColor: colors.text,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            {/* Avatar */}
            <View className="w-20 h-20 rounded-full bg-accent-soft items-center justify-center mb-3">
              <User size={32} color={colors.accent} />
            </View>
            <Text className="text-xl font-bold text-text-base mt-1">{displayName}</Text>
            {displayEmail ? (
              <Text className="text-sm text-text-mute mt-1">{displayEmail}</Text>
            ) : null}

            {/* Rating */}
            <Text className="text-sm font-medium text-text-mute mt-3 mb-1.5">Ваш рейтинг</Text>
            <View className="flex-row items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  color={colors.warning}
                  fill={star <= 4 ? colors.warning : "none"}
                />
              ))}
              <Text className="text-sm text-text-mute ml-1.5">4.5 (23 отзыва)</Text>
            </View>

            {/* Stats */}
            <View
              className={`flex-row mt-5 border border-border rounded-xl overflow-hidden${isDesktop ? " px-2 py-1 bg-white" : ""}`}
            >
              <View className="items-center px-6 py-2">
                <Text className="text-lg font-bold text-text-base">0</Text>
                <Text className="text-xs text-text-mute mt-0.5">Заявок</Text>
              </View>
              <View className="w-px bg-border" />
              <View className="items-center px-6 py-2">
                <Text className="text-lg font-bold text-text-base">0</Text>
                <Text className="text-xs text-text-mute mt-0.5">Консультаций</Text>
              </View>
              <View className="w-px bg-border" />
              <View className="items-center px-6 py-2">
                <Text className="text-lg font-bold text-text-base">—</Text>
                <Text className="text-xs text-text-mute mt-0.5">На платформе</Text>
              </View>
            </View>
          </View>

          {/* Section label */}
          <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider px-4 mb-1 mt-4">
            Меню
          </Text>

          {/* Menu Items Card */}
          <View className="bg-white mx-4 rounded-2xl border border-border overflow-hidden mb-4">
            {MENU_ITEMS.length === 0 ? (
              <EmptyState icon={FileText} title="Нет разделов" subtitle="Разделы профиля недоступны" />
            ) : (
              MENU_ITEMS.map((item, index) => (
                <Pressable
                  accessibilityRole="button"
                  key={item.id}
                  accessibilityLabel={item.label}
                  className={`flex-row items-center px-4 min-h-[52px] bg-white active:bg-surface2${
                    index < MENU_ITEMS.length - 1 ? " border-b border-border" : ""
                  }`}
                >
                  <View className="w-9 h-9 rounded-xl bg-accent-soft items-center justify-center mr-3">
                    <item.Icon size={17} color={colors.accent} />
                  </View>
                  <Text className="text-base font-medium text-text-base flex-1">{item.label}</Text>
                  {item.badge && (
                    <View className="bg-accent rounded-full px-2 py-0.5 mr-2">
                      <Text className="text-xs text-white font-semibold">{item.badge}</Text>
                    </View>
                  )}
                  <ChevronRight size={16} color={colors.textMuted} />
                </Pressable>
              ))
            )}
          </View>

          {/* Account section */}
          <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider px-4 mb-1 mt-4">
            Аккаунт
          </Text>

          {/* Logout Card */}
          <View className="bg-white mx-4 rounded-2xl border-t border-border overflow-hidden mb-4">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Выйти"
              onPress={signOut}
              className="flex-row items-center px-4 min-h-[52px] active:bg-danger-soft"
            >
              <View className="w-9 h-9 rounded-xl items-center justify-center mr-3 bg-danger-soft">
                <LogOut size={17} color={colors.danger} />
              </View>
              <Text className="flex-1 text-base font-medium text-danger">Выйти</Text>
            </Pressable>
          </View>

          <Text className="text-xs text-text-dim text-center mt-2 mb-4">Версия 1.0.0</Text>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
