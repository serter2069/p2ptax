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
      <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        Уведомления
      </Text>
      <View className="bg-white border border-slate-100 rounded-xl mb-6 overflow-hidden">
        <View className="flex-row items-center px-4 py-3 border-b border-slate-100">
          <View className="flex-1 mr-3">
            <Text className="text-base text-slate-900">Push-уведомления</Text>
            <Text className="text-xs text-slate-400 mt-0.5">
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
            <Text className="text-base text-slate-900">Email-уведомления</Text>
            <Text className="text-xs text-slate-400 mt-0.5">
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
