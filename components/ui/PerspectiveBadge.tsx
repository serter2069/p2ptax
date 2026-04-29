import { View, Text } from "react-native";
import { User, Briefcase } from "lucide-react-native";
import { colors } from "@/lib/theme";

/**
 * PerspectiveBadge — chip indicating whether the current user is
 * participating in a thread as the client or as the specialist.
 *
 * Used in:
 *  - Inbox row (`app/(tabs)/messages.tsx`) — distinguish dual-role threads.
 *  - Thread header (`components/InlineChatView.tsx`) — reinforce context.
 *
 * Two visual variants make the perspective glanceable:
 *   as_client      → blue (accentSoft / accent) + User icon
 *   as_specialist  → green (greenSoft / success) + Briefcase icon
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
  const isClient = perspective === "as_client";
  const label = isClient ? "Я: Клиент" : "Я: Специалист";

  const bg = isClient ? colors.accentSoft : colors.greenSoft;
  const fg = isClient ? colors.accent : colors.success;

  const isMd = size === "md";
  const fontSize = isMd ? 12 : 11;
  const paddingH = isMd ? 10 : 8;
  const paddingV = isMd ? 4 : 2;
  const iconSize = isMd ? 13 : 11;
  const Icon = isClient ? User : Briefcase;

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
