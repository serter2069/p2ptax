import { View, Text, Pressable } from "react-native";
import Avatar from "@/components/ui/Avatar";
import PerspectiveBadge from "@/components/ui/PerspectiveBadge";
import { colors, overlay } from "@/lib/theme";
import { displayName, formatTime } from "@/lib/threadDisplay";

export interface ThreadCardItem {
  id: string;
  otherUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    isDeleted?: boolean;
  };
  request: {
    id: string;
    title: string;
    status: string;
  };
  lastMessage: {
    text: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  createdAt: string;
  perspective?: "as_client" | "as_specialist";
}

interface ThreadCardProps {
  item: ThreadCardItem;
  onSelect?: () => void;
  onUserPress?: () => void;
  selected?: boolean;
  otherPartyFallback: string;
}

/**
 * Single row in the unified inbox list. Extracted from
 * `app/(tabs)/messages.tsx` — UI is byte-equivalent.
 */
export default function ThreadCard({
  item,
  onSelect,
  onUserPress,
  selected,
  otherPartyFallback,
}: ThreadCardProps) {
  const hasUnread = item.unreadCount > 0;
  const name = displayName(item.otherUser, otherPartyFallback);

  const handleUserPress = (e: { stopPropagation?: () => void }) => {
    if (e.stopPropagation) e.stopPropagation();
    if (onUserPress) onUserPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Чат с ${name}`}
      onPress={onSelect}
      className="flex-row items-center px-4 border-b border-border active:bg-surface2"
      style={({ pressed }) => [
        {
          backgroundColor: selected
            ? colors.accentSoft
            : hasUnread
              ? overlay.accent10
              : colors.surface,
          minHeight: 72,
          borderLeftWidth: hasUnread ? 3 : 0,
          borderLeftColor: hasUnread ? colors.primary : "transparent",
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
          elevation: 2,
        },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={
          item.perspective === "as_client" ? `Профиль специалиста ${name}` : name
        }
        onPress={handleUserPress}
        className="relative mr-3 my-3.5"
        style={{
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Avatar
          name={name}
          imageUrl={item.otherUser.avatarUrl ?? undefined}
          size="md"
        />
        <View
          className="absolute bottom-0 right-0 rounded-full bg-success"
          style={{
            width: 12,
            height: 12,
            borderWidth: 2,
            borderColor: colors.white,
          }}
        />
        {hasUnread && (
          <View
            className="absolute -top-0.5 -right-0.5 rounded-full"
            style={{ width: 10, height: 10, backgroundColor: colors.primary }}
          />
        )}
      </Pressable>

      <View className="flex-1 min-w-0 py-3.5">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            className={`text-base flex-shrink ${
              hasUnread
                ? "font-bold text-text-base"
                : "font-semibold text-text-base"
            }`}
            numberOfLines={1}
          >
            {name}
          </Text>
          {item.perspective ? (
            <View className="ml-2 flex-shrink-0">
              <PerspectiveBadge perspective={item.perspective} size="sm" />
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          {item.lastMessage && (
            <Text
              className={`text-xs flex-shrink-0 ${
                hasUnread ? "text-accent font-semibold" : "text-text-dim"
              }`}
            >
              {formatTime(item.lastMessage.createdAt)}
            </Text>
          )}
        </View>

        <Text className="text-xs text-text-dim mt-0.5" numberOfLines={1}>
          {item.request.title}
        </Text>

        {item.lastMessage ? (
          <Text
            className={`text-sm mt-1 ${hasUnread ? "font-semibold text-text-base" : "text-text-mute"}`}
            numberOfLines={2}
          >
            {item.lastMessage.text}
          </Text>
        ) : (
          <Text
            className="text-sm mt-1 italic text-text-dim"
            numberOfLines={1}
          >
            Нет сообщений
          </Text>
        )}
      </View>
    </Pressable>
  );
}
