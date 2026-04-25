import { View, Text } from "react-native";

type Status = "ACTIVE" | "CLOSING_SOON" | "CLOSED";

// Light-bg + dark-ink chips: passes WCAG AA where white-on-saturated didn't.
//   ACTIVE         #166534 on #ecfdf5  ~7.6:1
//   CLOSING_SOON   #92400e on #fef3c7  ~7.5:1
//   CLOSED         #374151 on #e5e7eb  ~8.0:1
const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: "Активна", bg: "bg-success-soft", text: "text-[#166534]" },
  CLOSING_SOON: { label: "Скоро закроется", bg: "bg-warning-soft", text: "text-[#92400e]" },
  CLOSED: { label: "Закрыта", bg: "bg-slate-200", text: "text-text-base" },
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
