import { View, Text } from "react-native";

type Status = "ACTIVE" | "CLOSING_SOON" | "CLOSED";

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: "Активна", bg: "bg-success", text: "text-white" },
  CLOSING_SOON: { label: "Скоро закроется", bg: "bg-warning", text: "text-white" },
  CLOSED: { label: "Закрыта", bg: "bg-slate-300", text: "text-text-base" },
};

interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE;

  return (
    <View className={`px-2 py-1 rounded-full ${config.bg}`}>
      <Text className={`text-xs font-medium ${config.text}`}>{config.label}</Text>
    </View>
  );
}
