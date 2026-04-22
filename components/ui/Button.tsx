import { Pressable, Text, ActivityIndicator } from "react-native";
import { useState } from "react";
import { type LucideIcon } from "lucide-react-native";
import { colors } from "../../lib/theme";

export interface ButtonProps {
  variant?: "primary" | "secondary" | "destructive";
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: LucideIcon;
}

export default function Button({
  variant = "primary",
  label,
  onPress,
  loading = false,
  disabled = false,
  fullWidth = true,
  icon: Icon,
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);

  const widthClass = fullWidth ? "w-full" : "px-6";
  const opacityClass = disabled || loading ? "opacity-40" : "";

  const baseContainerClass = `rounded-xl h-12 flex-row items-center justify-center ${widthClass} ${opacityClass}`;

  const variantStyle =
    variant === "primary"
      ? { backgroundColor: colors.primary }
      : variant === "secondary"
        ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
        : { backgroundColor: colors.danger };

  const shadowStyle = variant === "primary" && !pressed
    ? { shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }
    : undefined;

  const pressStyle = pressed
    ? { opacity: 0.9, transform: [{ scale: 0.98 as const }] }
    : undefined;

  const textColorValue =
    variant === "primary" || variant === "destructive" ? "#ffffff" : colors.text;

  const iconColor =
    variant === "primary" || variant === "destructive" ? "#ffffff" : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      className={baseContainerClass}
      style={[variantStyle, shadowStyle, pressStyle]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <>
          {Icon && (
            <Icon
              size={18}
              color={iconColor}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            className="text-base font-semibold"
            style={{ color: textColorValue }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
