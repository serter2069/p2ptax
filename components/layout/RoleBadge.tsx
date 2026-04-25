import { View, Text } from "react-native";
import { roleAccent, type RoleAccentKey } from "@/lib/theme";
import type { UserRole } from "@/contexts/AuthContext";

export interface RoleBadgeProps {
  role: UserRole;
  /**
   * Iter11 PR 3 — specialist mode is now opt-in via the `isSpecialist`
   * flag on USER accounts. Callers should pass it so the badge can render
   * "Специалист" for specialist-mode users and "Клиент" for plain USERs.
   */
  isSpecialist?: boolean;
  size?: "sm" | "md";
}

/**
 * Resolve the role-accent key for the badge. Admin wins over specialist
 * because platform moderators keep the amber accent regardless of flag.
 */
function toAccentKey(role: UserRole, isSpecialist: boolean): RoleAccentKey {
  if (role === "ADMIN") return "admin";
  if (isSpecialist) return "specialist";
  return "client";
}

/**
 * Small pill shown inside {@link AppHeader} / {@link SidebarNav} to signal
 * which portal the current user is in. Colour map lives in `lib/theme.ts`.
 */
export default function RoleBadge({ role, isSpecialist = false, size = "sm" }: RoleBadgeProps) {
  if (!role) return null;

  const accent = roleAccent[toAccentKey(role, isSpecialist)];
  const paddingClass = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";
  const textSizeClass = size === "sm" ? "text-xs" : "text-sm";

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
