import { View, Pressable, type ViewStyle } from "react-native";
import { colors } from "../../lib/theme";

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  /** Extra className passed to the outer View (e.g. "mb-4 mt-2"). */
  className?: string;
  /** Extra inline style for the outer View (e.g. overflow: "hidden"). */
  style?: ViewStyle;
  /** Forwarded to the inner View for automated testing. */
  testID?: string;
}

const paddingMap = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 24,
} as const;

export default function Card({
  children,
  onPress,
  variant = "default",
  padding = "md",
  className,
  style,
  testID,
}: CardProps) {
  const variantClass = `bg-white rounded-2xl border${className ? ` ${className}` : ""}`;

  const variantBorderColor = colors.border;

  const shadowStyle =
    variant === "default"
      ? {
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 3,
        }
      : undefined;

  const content = (
    <View
      className={variantClass}
      style={[{ padding: paddingMap[padding], borderColor: variantBorderColor, backgroundColor: colors.surface }, shadowStyle, style]}
      testID={testID}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Карточка"
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
