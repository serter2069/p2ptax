import { View, Text } from "react-native";
import { roleAccent, type RoleAccentKey } from "@/lib/theme";
import type { UserRole } from "@/contexts/AuthContext";

export interface RoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md";
}

/**
 * Maps {@link UserRole} (uppercase DB enum) to the role-accent key used
 * by the theme. Falls back to `client` so the badge always has a colour
 * to render instead of disappearing silently.
 */
function toAccentKey(role: UserRole): RoleAccentKey {
  switch (role) {
    case "SPECIALIST":
      return "specialist";
    case "ADMIN":
      return "admin";
    case "CLIENT":
    default:
      return "client";
  }
}

/**
 * Small pill shown inside {@link AppHeader} to signal which portal the
 * current user is in. Colour map lives in `lib/theme.ts`.
 */
export default function RoleBadge({ role, size = "sm" }: RoleBadgeProps) {
  if (!role) return null;

  const accent = roleAccent[toAccentKey(role)];
  const paddingClass = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";
  const textSizeClass = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <View
      className={`${paddingClass} rounded-full flex-row items-center`}
      style={{ backgroundColor: accent.soft }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: accent.strong,
          marginRight: 6,
        }}
      />
      <Text
        className={`${textSizeClass} font-semibold`}
        style={{ color: accent.strong }}
      >
        {accent.label}
      </Text>
    </View>
  );
}
