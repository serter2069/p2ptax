import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FileText, ChevronRight } from "lucide-react-native";
import { Avatar } from "@/components/ui";
import PerspectiveBadge from "@/components/ui/PerspectiveBadge";
import { colors } from "@/lib/theme";
import { displayName } from "./chatUtils";

interface OtherUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isDeleted?: boolean;
}

interface RequestInfo {
  id: string;
  title: string;
  status: string;
}

export interface ChatHeaderProps {
  otherUser: OtherUser | null;
  otherName: string;
  myId: string | undefined;
  clientId?: string;
  specialistId?: string;
  requestId?: string;
  request?: RequestInfo;
  isDesktop: boolean;
  /** Instrumental-case name for the "Вы переписываетесь с X" hint */
  counterpartyInstrumental: string;
}

/** Minimal header shown during loading / error states before thread data is available. */
export function ChatShellHeader({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View className="flex-row items-center px-4 py-3 border-b border-border bg-white">
      {!isDesktop && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Назад"
          onPress={() => router.back()}
          className="mr-3 w-11 h-11 items-center justify-center"
        >
          <FontAwesome name="chevron-left" size={18} color={colors.primary} />
        </Pressable>
      )}
      <Text className="text-base font-semibold" style={{ color: colors.primary }}>Чат</Text>
    </View>
  );
}

export default function ChatHeader({
  otherUser,
  otherName,
  myId,
  clientId,
  specialistId,
  requestId,
  request,
  isDesktop,
  counterpartyInstrumental,
}: ChatHeaderProps) {
  const myPerspective: "as_client" | "as_specialist" | null =
    myId && clientId && specialistId
      ? clientId === myId
        ? "as_client"
        : specialistId === myId
        ? "as_specialist"
        : null
      : null;

  return (
    <>
      {/* Header row */}
      <View className="flex-row items-start px-4 py-3 border-b border-border bg-white">
        {!isDesktop && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Назад"
            onPress={() => router.back()}
            className="mr-3 w-11 h-11 items-center justify-center"
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <FontAwesome name="chevron-left" size={18} color={colors.primary} />
          </Pressable>
        )}
        {otherUser ? (
          <Avatar
            name={displayName(otherUser)}
            imageUrl={otherUser.avatarUrl ?? undefined}
            size="sm"
          />
        ) : (
          <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.border }}>
            <FontAwesome name="user" size={16} color={colors.textSecondary} />
          </View>
        )}
        <View className="ml-3 flex-1" style={{ gap: 4 }}>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Text className="text-base font-semibold flex-shrink" style={{ color: colors.text }} numberOfLines={1}>
              {otherName}
            </Text>
            {myPerspective ? (
              <PerspectiveBadge perspective={myPerspective} size="md" />
            ) : null}
          </View>
          {myPerspective ? (
            <Text className="text-xs" style={{ color: colors.textSecondary }} numberOfLines={1}>
              Вы переписываетесь с {counterpartyInstrumental}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Source request link strip */}
      {requestId ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Открыть заявку ${request?.title ?? ""}`}
          onPress={() => router.push(`/requests/${requestId}/detail` as never)}
          style={({ pressed }) => [
            {
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: colors.surface2,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              gap: 8,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <FileText size={14} color={colors.accent} />
          <Text style={{ flex: 1, fontSize: 13, color: colors.text }} numberOfLines={1}>
            По заявке: {request?.title || "Заявка"}
          </Text>
          <ChevronRight size={14} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </>
  );
}
