import { View, Text, Pressable, useWindowDimensions, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { Bell, Settings } from "lucide-react-native";
import { colors } from "@/lib/theme";
import Logo from "@/components/brand/Logo";

interface HeaderHomeProps {
  notificationCount?: number;
  onSettingsPress?: () => void;
}

/**
 * HeaderHome — top bar for tab-group screens.
 *
 * iter10 Phase 3a: on desktop web (>=768px) AppShell + AppHeader own the
 * chrome — HeaderHome renders `null` to avoid double chrome. On mobile
 * we keep the full-bleed blue brand bar because the sidebar isn't shown.
 */
export default function HeaderHome({ notificationCount = 0, onSettingsPress }: HeaderHomeProps) {
  const router = useRouter()
  const nav = useTypedRouter();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 768;

  if (isDesktopWeb) {
    return null;
  }

  return (
    <View className="flex-row items-center justify-between h-14 px-4" style={{ backgroundColor: colors.primary }}>
      <Logo variant="white" size="md" />
      <View className="flex-row items-center gap-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Уведомления"
          onPress={() => nav.routes.notifications()}
          className="w-11 h-11 items-center justify-center"
        >
          <Bell size={18} color={colors.surface} />
          {notificationCount > 0 && (
            <View className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-warning items-center justify-center px-1">
              <Text className="text-xs font-bold text-white">
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
