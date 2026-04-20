import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { colors } from "@/lib/theme";

interface HeaderHomeProps {
  notificationCount?: number;
  onSettingsPress?: () => void;
}

export default function HeaderHome({ notificationCount = 0, onSettingsPress }: HeaderHomeProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between h-14 bg-blue-900 px-4">
      <Text className="text-lg font-bold text-white">P2PTax</Text>
      <View className="flex-row items-center gap-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Уведомления"
          onPress={() => router.push("/notifications" as never)}
          className="w-11 h-11 items-center justify-center"
        >
          <FontAwesome name="bell-o" size={18} color={colors.surface} />
          {notificationCount > 0 && (
            <View className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-amber-500 items-center justify-center px-1">
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
            <FontAwesome name="cog" size={18} color={colors.surface} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
