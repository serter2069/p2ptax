import { View, Text } from "react-native";
import { User, Briefcase } from "lucide-react-native";
import { colors } from "@/lib/theme";

/**
 * PerspectiveBadge — chip describing the OTHER party in a thread.
 *
 * `perspective` is the viewer's own role; the chip displays the
 * counterpart so the inbox can be scanned at a glance ('this thread is
 * with a specialist' vs 'with a client'). Without the inversion every
 * row showed 'Клиент' for a viewer who only ever acts as a client —
 * dead-weight badge (UX feedback May 2026).
 *
 * Used in:
 *  - Inbox row (`app/(tabs)/messages.tsx`) — distinguish dual-role threads.
 *  - Thread header (`components/InlineChatView.tsx`) — reinforce context.
 *
 * Two sizes:
 *   sm  — for thread cards in the inbox list (compact, dense)
 *   md  — for chat header (more prominent)
 */
export interface PerspectiveBadgeProps {
  perspective: "as_client" | "as_specialist";
  size?: "sm" | "md";
}

export default function PerspectiveBadge({
  perspective,
  size = "sm",
}: PerspectiveBadgeProps) {
  const otherIsSpecialist = perspective === "as_client";
  const label = otherIsSpecialist ? "Специалист" : "Клиент";

  // Specialist → green (matches specialist surfaces elsewhere),
  // Client → blue (the regular accent).
  const bg = otherIsSpecialist ? colors.greenSoft : colors.accentSoft;
  const fg = otherIsSpecialist ? colors.success : colors.accent;

  const isMd = size === "md";
  const fontSize = isMd ? 12 : 11;
  const paddingH = isMd ? 10 : 8;
  const paddingV = isMd ? 4 : 2;
  const iconSize = isMd ? 13 : 11;
  const Icon = otherIsSpecialist ? Briefcase : User;

  return (
    <View
      className="flex-row items-center rounded-full"
      style={{
        backgroundColor: bg,
        paddingHorizontal: paddingH,
        paddingVertical: paddingV,
        alignSelf: "flex-start",
        gap: 4,
      }}
    >
      <Icon size={iconSize} color={fg} strokeWidth={2.25} />
      <Text
        style={{
          color: fg,
          fontSize,
          fontWeight: "600",
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
