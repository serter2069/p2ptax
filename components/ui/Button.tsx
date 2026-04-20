import { Pressable, Text, ActivityIndicator } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { colors } from "../../lib/theme";

export interface ButtonProps {
  variant?: "primary" | "secondary" | "destructive";
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ComponentProps<typeof FontAwesome>["name"];
}

const variantStyles = {
  primary: {
    container: "bg-blue-900 rounded-xl h-12 flex-row items-center justify-center",
    text: "text-white text-base font-semibold",
    iconColor: colors.surface,
  },
  secondary: {
    container: "bg-white border border-slate-200 rounded-xl h-12 flex-row items-center justify-center",
    text: "text-slate-900 text-base font-semibold",
    iconColor: colors.primary,
  },
  destructive: {
    container: "bg-red-600 rounded-xl h-12 flex-row items-center justify-center",
    text: "text-white text-base font-semibold",
    iconColor: colors.surface,
  },
} as const;

export default function Button({
  variant = "primary",
  label,
  onPress,
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
}: ButtonProps) {
  const styles = variantStyles[variant];
  const widthClass = fullWidth ? "w-full" : "";
  const opacityClass = disabled || loading ? "opacity-40" : "";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled || loading}
      className={`${styles.container} ${widthClass} ${opacityClass}`}
      style={({ pressed }) => [
        variant === "primary" && !pressed
          ? { shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 }
          : undefined,
        pressed ? { opacity: 0.9, transform: [{ scale: 0.98 }] } : undefined,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={styles.iconColor} />
      ) : (
        <>
          {icon && (
            <FontAwesome
              name={icon}
              size={18}
              color={styles.iconColor}
              style={{ marginRight: 8 }}
            />
          )}
          <Text className={styles.text}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
