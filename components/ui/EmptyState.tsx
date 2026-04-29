import { useWindowDimensions, View, Text } from "react-native";
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;
  return (
    <View className="items-center justify-center py-12 px-8">
      <View
        className="items-center justify-center rounded-full"
        style={{ width: 72, height: 72, backgroundColor: colors.accentSoft }}
      >
        <Icon size={32} color={colors.accent} />
      </View>
      <Text
        className="font-bold text-text-base mt-4 text-center"
        style={{ fontSize: 18, lineHeight: 22 }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text className="text-sm text-text-mute mt-2 text-center leading-5">
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <View className="mt-5" style={isDesktop ? { minWidth: 200 } : undefined}>
          <Button variant="primary" label={actionLabel} onPress={onAction} fullWidth={isDesktop} />
        </View>
      )}
    </View>
  );
}
