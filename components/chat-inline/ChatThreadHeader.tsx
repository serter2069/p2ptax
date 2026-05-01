/**
 * ChatThreadHeader — header bar for the inline chat view.
 * Extracted from InlineChatView to keep that file under 500 LOC.
 * Renders: back button (mobile), avatar + name, perspective badge,
 * "переписываетесь с" subtitle, and three-dots menu with clear-chat option.
 */
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Avatar } from "@/components/ui";
import PerspectiveBadge from "@/components/ui/PerspectiveBadge";
import { colors } from "@/lib/theme";
import { Z, layer } from "@/lib/zIndex";

interface OtherUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isDeleted?: boolean;
}

interface ThreadInfo {
  id: string;
  requestId: string;
  clientId: string;
  specialistId: string;
}

interface ChatThreadHeaderProps {
  isDesktop: boolean;
  otherUser: OtherUser | null;
  otherName: string;
  thread: ThreadInfo | null;
  myId: string | undefined;
  menuVisible: boolean;
  clearingThread: boolean;
  canViewSpecialistProfile: boolean;
  nameInInstrumental: (name: string) => string;
  displayName: (user: { firstName: string | null; lastName: string | null; isDeleted?: boolean }) => string;
  onMenuToggle: () => void;
  onOtherUserPress: () => void;
  onClearThread: () => void;
}

export default function ChatThreadHeader({
  isDesktop,
  otherUser,
  otherName,
  thread,
  myId,
  menuVisible,
  clearingThread,
  canViewSpecialistProfile,
  nameInInstrumental,
  displayName,
  onMenuToggle,
  onOtherUserPress,
  onClearThread,
}: ChatThreadHeaderProps) {
  return (
    <>
      <View className="flex-row items-center px-4 py-3 border-b border-border bg-white">
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

        {/* Avatar + name: tappable → specialist profile (client view only) */}
        <Pressable
          accessibilityRole={canViewSpecialistProfile ? "link" : "none"}
          accessibilityLabel={canViewSpecialistProfile ? `Профиль специалиста ${otherName}` : undefined}
          onPress={canViewSpecialistProfile ? onOtherUserPress : undefined}
          className="flex-row items-start flex-1 min-w-0"
          style={({ pressed }) => [pressed && canViewSpecialistProfile ? { opacity: 0.7 } : undefined]}
        >
          {otherUser ? (
            <Avatar
              name={displayName(otherUser)}
              imageUrl={otherUser.avatarUrl ?? undefined}
              size="sm"
            />
          ) : (
            <View
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.border }}
            >
              <FontAwesome name="user" size={16} color={colors.textSecondary} />
            </View>
          )}
          <View className="ml-3 flex-1 min-w-0" style={{ gap: 4 }}>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Text
                className="text-base font-semibold flex-shrink"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {otherName}
              </Text>
              {thread && myId ? (
                thread.clientId === myId ? (
                  <PerspectiveBadge perspective="as_client" size="md" />
                ) : thread.specialistId === myId ? (
                  <PerspectiveBadge perspective="as_specialist" size="md" />
                ) : null
              ) : null}
            </View>
            {thread && myId ? (
              (() => {
                const myPerspective: "as_client" | "as_specialist" | null =
                  thread.clientId === myId
                    ? "as_client"
                    : thread.specialistId === myId
                      ? "as_specialist"
                      : null;
                if (!myPerspective) return null;
                const counterpartyFallback =
                  myPerspective === "as_client" ? "Специалистом" : "Клиентом";
                const namedCounterparty =
                  otherUser && !otherUser.isDeleted
                    ? nameInInstrumental(displayName(otherUser))
                    : counterpartyFallback;
                return (
                  <Text
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    Вы переписываетесь с {namedCounterparty}
                  </Text>
                );
              })()
            ) : null}
          </View>
        </Pressable>

        {/* Three-dots menu button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Меню чата"
          onPress={onMenuToggle}
          disabled={clearingThread}
          className="w-10 h-10 items-center justify-center ml-1"
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          {clearingThread ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={{ fontSize: 22, color: colors.textSecondary, lineHeight: 24 }}>
              {"⋯"}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Dropdown menu */}
      {menuVisible && (
        <Pressable
          accessibilityRole="button"
          onPress={onMenuToggle}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: Z.STICKY,
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 56,
              right: 12,
              backgroundColor: "#fff",
              borderRadius: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              ...layer("POPOVER"),
              minWidth: 200,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Очистить переписку"
              onPress={onClearThread}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  borderRadius: 10,
                },
                pressed && { backgroundColor: "#fef2f2" },
              ]}
            >
              <FontAwesome name="trash-o" size={16} color={colors.danger} />
              <Text style={{ color: colors.danger, fontSize: 15 }}>Очистить переписку</Text>
            </Pressable>
          </View>
        </Pressable>
      )}
    </>
  );
}
