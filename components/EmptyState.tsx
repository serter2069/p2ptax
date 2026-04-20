import { View, Text } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Button from "@/components/ui/Button";
import { colors } from "@/lib/theme";

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof FontAwesome>["name"];
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = "inbox",
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-8">
      <FontAwesome name={icon} size={64} color={colors.placeholder} />
      <Text className="text-lg font-semibold text-slate-900 mt-4 text-center">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-sm text-slate-400 mt-2 text-center">{subtitle}</Text>
      )}
      {actionLabel && onAction && (
        <View className="mt-4">
          <Button
            label={actionLabel}
            onPress={onAction}
            fullWidth={false}
          />
        </View>
      )}
    </View>
  );
}
