import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Bell, Settings } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface HeaderHomeProps {
  notificationCount?: number;
  onSettingsPress?: () => void;
}

export default function HeaderHome({ notificationCount = 0, onSettingsPress }: HeaderHomeProps) {
  const router = useRouter();

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
              <Text className="text-[9px] font-bold text-white">
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
