import { View, Text } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Button from "./Button";
import { colors } from "../../lib/theme";

export interface EmptyStateProps {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-12 px-8">
      <View
        className="items-center justify-center rounded-full bg-slate-100"
        style={{ width: 72, height: 72 }}
      >
        <FontAwesome name={icon} size={32} color={colors.placeholder} />
      </View>
      <Text className="text-base font-semibold text-slate-900 mt-4 text-center">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-sm text-slate-500 mt-2 text-center">
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <View className="mt-4">
          <Button variant="secondary" label={actionLabel} onPress={onAction} fullWidth={false} />
        </View>
      )}
    </View>
  );
}
