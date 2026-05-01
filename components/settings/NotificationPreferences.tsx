import { View, Text } from "react-native";
import StyledSwitch from "@/components/ui/StyledSwitch";

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
    <>
      <View className="flex-row items-center py-3 border-b border-border">
        <View className="flex-1 mr-3">
          <Text className="text-base text-text-base">Push-уведомления</Text>
          <Text className="text-xs text-text-mute mt-0.5">
            Новые запросы и сообщения
          </Text>
        </View>
        <StyledSwitch value={pushEnabled} onValueChange={onPushChange} />
      </View>
      <View className="flex-row items-center py-3 border-b border-border">
        <View className="flex-1 mr-3">
          <Text className="text-base text-text-base">Email-уведомления</Text>
          <Text className="text-xs text-text-mute mt-0.5">
            Дублировать уведомления на почту
          </Text>
        </View>
        <StyledSwitch value={emailEnabled} onValueChange={onEmailChange} />
      </View>
    </>
  );
}
