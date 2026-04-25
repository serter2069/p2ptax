import { Pressable, Text, ActivityIndicator } from "react-native";
import { useState } from "react";
import { type LucideIcon } from "lucide-react-native";
import { colors, gray } from "../../lib/theme";

export interface ButtonProps {
  variant?: "primary" | "secondary" | "destructive";
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: LucideIcon;
  testID?: string;
}

export default function Button({
  variant = "primary",
  label,
  onPress,
  loading = false,
  disabled = false,
  fullWidth = true,
  icon: Icon,
  testID,
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);

  const widthClass = fullWidth ? "w-full" : "px-6";

  const baseContainerClass = `rounded-xl h-12 flex-row items-center justify-center ${widthClass}`;

  const isInactive = disabled || loading;

  // Issue GH-1290 — disabled must be a clearly different fill (gray[200] /
  // gray[400]) so users don't tap a bleached-primary that looks active.
  // Loading keeps the variant fill and shows a spinner instead.
  const variantStyle = isInactive && disabled && !loading
    ? { backgroundColor: gray[200], borderWidth: 0 }
    : variant === "primary"
      ? { backgroundColor: colors.primary }
      : variant === "secondary"
        ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
        : { backgroundColor: colors.danger };

  const shadowStyle = variant === "primary" && !pressed && !isInactive
    ? { shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }
    : undefined;

  const pressStyle = pressed
    ? { opacity: 0.9, transform: [{ scale: 0.98 as const }] }
    : undefined;

  const textColorValue =
    disabled && !loading
      ? gray[600]
      : variant === "primary" || variant === "destructive"
        ? colors.white
        : colors.text;

  const iconColor =
    disabled && !loading
      ? gray[600]
      : variant === "primary" || variant === "destructive"
        ? colors.white
        : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      testID={testID}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isInactive}
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
