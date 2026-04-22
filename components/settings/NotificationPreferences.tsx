import { View, Text, Switch } from "react-native";
import { colors } from "@/lib/theme";

interface NotificationPreferencesProps {
  pushEnabled: boolean;
  emailEnabled: boolean;
  onPushChange: (val: boolean) => void;
  onEmailChange: (val: boolean) => void;
}

export default function NotificationPreferences({
  pushEnabled,
  emailEnabled,
  onPushChange,
  onEmailChange,
}: NotificationPreferencesProps) {
  return (
    <View>
      <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide mb-3">
        Уведомления
      </Text>
      <View className="bg-white border border-border rounded-xl mb-6 overflow-hidden">
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <View className="flex-1 mr-3">
            <Text className="text-base text-text-base">Push-уведомления</Text>
            <Text className="text-xs text-text-mute mt-0.5">
              Новые заявки и сообщения
            </Text>
          </View>
          <Switch
            accessibilityLabel="Push-уведомления"
            value={pushEnabled}
            onValueChange={onPushChange}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>
        <View className="flex-row items-center px-4 py-3">
          <View className="flex-1 mr-3">
            <Text className="text-base text-text-base">Email-уведомления</Text>
            <Text className="text-xs text-text-mute mt-0.5">
              Дублировать уведомления на почту
            </Text>
          </View>
          <Switch
            accessibilityLabel="Email-уведомления"
            value={emailEnabled}
            onValueChange={onEmailChange}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>
      </View>
    </View>
  );
}
