import { View, Text, Switch, Pressable, Platform } from "react-native";
import { colors } from "@/lib/theme";

// On web RN's <Switch> renders as ~40x20 native HTML <input type="checkbox">.
// Vizor / a11y audits measure that inner DOM element, not the Pressable
// wrapper. Forcing height: 44 + width: 52 directly on the Switch makes the
// rendered element clear the 44x44 minimum tap-target threshold (WCAG 2.5.5).
const switchWebStyle =
  Platform.OS === "web"
    ? ({ height: 44, width: 52 } as const)
    : undefined;

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
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Push-уведомления"
            accessibilityState={{ checked: pushEnabled }}
            onPress={() => onPushChange(!pushEnabled)}
            style={{ width: 56, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Switch
              accessibilityLabel="Push-уведомления"
              value={pushEnabled}
              onValueChange={onPushChange}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              pointerEvents="none"
              style={switchWebStyle}
            />
          </Pressable>
        </View>
        <View className="flex-row items-center px-4 py-3">
          <View className="flex-1 mr-3">
            <Text className="text-base text-text-base">Email-уведомления</Text>
            <Text className="text-xs text-text-mute mt-0.5">
              Дублировать уведомления на почту
            </Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Email-уведомления"
            accessibilityState={{ checked: emailEnabled }}
            onPress={() => onEmailChange(!emailEnabled)}
            style={{ width: 56, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Switch
              accessibilityLabel="Email-уведомления"
              value={emailEnabled}
              onValueChange={onEmailChange}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              pointerEvents="none"
              style={switchWebStyle}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
