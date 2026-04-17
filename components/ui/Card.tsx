import { View, Pressable } from "react-native";

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "outlined";
  padding?: "sm" | "md" | "lg";
}

const paddingMap = {
  sm: 12,
  md: 16,
  lg: 24,
} as const;

export default function Card({
  children,
  onPress,
  variant = "default",
  padding = "md",
}: CardProps) {
  const variantClass =
    variant === "default"
      ? "bg-white rounded-2xl border border-slate-100"
      : "bg-white rounded-2xl border border-slate-200";

  const shadowStyle =
    variant === "default"
      ? {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 3,
        }
      : undefined;

  const content = (
    <View
      className={variantClass}
      style={[{ padding: paddingMap[padding] }, shadowStyle]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) =>
          pressed ? { transform: [{ scale: 0.98 }] } : undefined
        }
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
