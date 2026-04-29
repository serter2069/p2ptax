import { View, Text } from "react-native";
import NotificationPreferences from "@/components/settings/NotificationPreferences";

interface NotificationsTabProps {
  emailEnabled: boolean;
  pushEnabled: boolean;
  onEmailChange: (v: boolean) => void;
  onPushChange: (v: boolean) => void;
}

export default function NotificationsTab({
  emailEnabled,
  pushEnabled,
  onEmailChange,
  onPushChange,
}: NotificationsTabProps) {
  return (
    <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
      <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
        Уведомления
      </Text>
      <NotificationPreferences
        pushEnabled={pushEnabled}
        emailEnabled={emailEnabled}
        onPushChange={onPushChange}
        onEmailChange={onEmailChange}
      />
    </View>
  );
}
