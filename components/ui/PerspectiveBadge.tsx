import { View, Text } from "react-native";
import { colors } from "@/lib/theme";

/**
 * PerspectiveBadge — small uppercase chip indicating whether the current
 * user is participating in a thread as the client or as the specialist.
 *
 * Used in:
 *  - Inbox row (`app/(tabs)/messages.tsx`) — distinguish dual-role threads.
 *  - Thread header (`components/InlineChatView.tsx`) — reinforce context.
 */
export interface PerspectiveBadgeProps {
  perspective: "as_client" | "as_specialist";
}

export default function PerspectiveBadge({ perspective }: PerspectiveBadgeProps) {
  const isClient = perspective === "as_client";
  const label = isClient ? "Я КЛИЕНТ" : "Я СПЕЦИАЛИСТ";

  const bg = isClient ? colors.surface2 : colors.accentSoft;
  const fg = isClient ? colors.textSecondary : colors.accentSoftInk;

  return (
    <View
      className="rounded-full"
      style={{
        backgroundColor: bg,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color: fg,
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.6,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
