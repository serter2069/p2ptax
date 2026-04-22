import { View, Text } from "react-native";
import { Inbox, type LucideIcon } from "lucide-react-native";
import Button from "./Button";
import { colors } from "../../lib/theme";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-12 px-8">
      <View
        className="items-center justify-center rounded-full"
        style={{ width: 72, height: 72, backgroundColor: colors.accentSoft }}
      >
        <Icon size={32} color={colors.accent} />
      </View>
      <Text className="text-base font-semibold text-text-base mt-4 text-center">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-sm text-text-mute mt-2 text-center leading-5">
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <View className="mt-5">
          <Button variant="primary" label={actionLabel} onPress={onAction} fullWidth={false} />
        </View>
      )}
    </View>
  );
}
