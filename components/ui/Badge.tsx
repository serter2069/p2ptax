import { View, Text } from "react-native";

export interface BadgeProps {
  variant?: "error" | "success" | "warning" | "info";
  label: string;
  size?: "sm" | "md";
}

const variantStyles = {
  error: { bg: "bg-danger-soft", text: "text-danger", dotColor: "#b91c1c" },
  success: { bg: "bg-success-soft", text: "text-success", dotColor: "#047857" },
  warning: { bg: "bg-warning-soft", text: "text-warning", dotColor: "#d97706" },
  info: { bg: "bg-sky-50", text: "text-sky-700", dotColor: "#2256c2" },
} as const;

export default function Badge({
  variant = "info",
  label,
  size = "md",
}: BadgeProps) {
  const styles = variantStyles[variant];
  const sizeClass = size === "sm" ? "px-2 py-0.5" : "px-3 py-1";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <View className={`${styles.bg} ${sizeClass} rounded-lg flex-row items-center`}>
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: styles.dotColor,
          marginRight: 6,
        }}
      />
      <Text className={`${textSize} font-medium ${styles.text}`}>{label}</Text>
    </View>
  );
}
