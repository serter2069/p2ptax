import { View, Text, Pressable, useWindowDimensions, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Bell, Settings } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface HeaderHomeProps {
  notificationCount?: number;
  onSettingsPress?: () => void;
}

/**
 * HeaderHome — top bar for tab-group screens.
 *
 * - Mobile (<1024px, including native): full-bleed blue bar (brand presence,
 *   constrained vertical space).
 * - Desktop web (>=1024px): subtle white bar with bottom border — the sidebar
 *   carries the brand, so a second full-bleed blue bar reads as a mobile
 *   stretched-to-wide mistake (Gemini critique #1).
 */
export default function HeaderHome({ notificationCount = 0, onSettingsPress }: HeaderHomeProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 1024;

  if (isDesktopWeb) {
    return (
      <View
        className="flex-row items-center justify-end h-14 px-6 border-b"
        style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}
      >
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Уведомления"
            onPress={() => router.push("/notifications" as never)}
            className="w-11 h-11 rounded-lg items-center justify-center"
          >
            <Bell size={18} color={colors.textSecondary} />
            {notificationCount > 0 && (
              <View className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-warning items-center justify-center px-1">
                <Text className="text-[10px] font-bold text-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </Text>
              </View>
            )}
          </Pressable>
          {onSettingsPress && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Настройки"
              onPress={onSettingsPress}
              className="w-11 h-11 rounded-lg items-center justify-center"
            >
              <Settings size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-between h-14 px-4" style={{ backgroundColor: colors.primary }}>
      <Text className="text-lg font-bold text-white">P2PTax</Text>
      <View className="flex-row items-center gap-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Уведомления"
          onPress={() => router.push("/notifications" as never)}
          className="w-11 h-11 items-center justify-center"
        >
          <Bell size={18} color={colors.surface} />
          {notificationCount > 0 && (
            <View className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-warning items-center justify-center px-1">
              <Text className="text-[10px] font-bold text-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </Text>
            </View>
          )}
        </Pressable>
        {onSettingsPress && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Настройки"
            onPress={onSettingsPress}
            className="w-11 h-11 items-center justify-center"
          >
            <Settings size={18} color={colors.surface} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
