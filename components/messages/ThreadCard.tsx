import { View, Text, Pressable, Image } from "react-native";
import Avatar from "@/components/ui/Avatar";
import PerspectiveBadge from "@/components/ui/PerspectiveBadge";
import { colors, overlay } from "@/lib/theme";
import { displayName, formatTime } from "@/lib/threadDisplay";
import { API_URL } from "@/lib/api";

export interface LastMessageAttachment {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
}

export interface ThreadCardItem {
  id: string;
  otherUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    isDeleted?: boolean;
    // TODO: populate from API once lastSeenAt is tracked on User model
    isOnline?: boolean;
  };
  request: {
    id: string;
    title: string;
    status: string;
  };
  lastMessage: {
    text: string;
    createdAt: string;
    attachments?: LastMessageAttachment[];
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
        className="mr-3 my-3.5"
        style={{
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View style={{ position: "relative" }}>
          <Avatar
            name={name}
            imageUrl={item.otherUser.avatarUrl ?? undefined}
            size="md"
          />
          {item.otherUser.isOnline && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#10b981",
                borderWidth: 2,
                borderColor: colors.white,
              }}
            />
          )}
        </View>
      </Pressable>

      <View className="flex-1 min-w-0 py-3.5" style={{ paddingRight: hasUnread ? 8 : 0 }}>
        {/* S3 fix — give the name flex-1 + min-w-0 so it gets the bulk of the row width
            and only ellipsises for genuinely long names. Timestamp is fixed-width on the
            right (flex-shrink-0). Perspective badge sits between name and timestamp, also
            shrink-proof. Removed the spacer-View that previously starved the name. */}
        <View className="flex-row items-center gap-2">
          <Text
            className={`flex-1 min-w-0 text-base ${
              hasUnread
                ? "font-bold text-text-base"
                : "font-semibold text-text-base"
            }`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {name}
          </Text>
          {item.perspective ? (
            <View className="flex-shrink-0">
              <PerspectiveBadge perspective={item.perspective} size="sm" />
            </View>
          ) : null}
          {item.lastMessage && (
            <Text
              className={`text-xs flex-shrink-0 ${
                hasUnread ? "text-accent font-semibold" : "text-text-dim"
              }`}
              numberOfLines={1}
            >
              {formatTime(item.lastMessage.createdAt)}
            </Text>
          )}
        </View>

        <Text className="text-xs text-text-dim mt-0.5" numberOfLines={1}>
          {item.request.title}
        </Text>

        {item.lastMessage ? (
          (() => {
            const firstImage = item.lastMessage.attachments?.find(
              (a) => a.mimeType.startsWith("image/")
            );
            if (firstImage) {
              const imageUri = firstImage.url.startsWith("http")
                ? firstImage.url
                : `${API_URL}${firstImage.url}`;
              return (
                <View className="flex-row items-center mt-1" style={{ gap: 6 }}>
                  <Image
                    source={{ uri: imageUri }}
                    style={{ width: 40, height: 40, borderRadius: 6 }}
                    resizeMode="cover"
                    accessibilityLabel={firstImage.filename}
                  />
                  <Text
                    className={`text-sm flex-1 ${hasUnread ? "font-semibold text-text-base" : "text-text-mute"}`}
                    numberOfLines={1}
                  >
                    {item.lastMessage.text || `Файл: ${firstImage.filename}`}
                  </Text>
                </View>
              );
            }
            return (
              <Text
                className={`text-sm mt-1 ${hasUnread ? "font-semibold text-text-base" : "text-text-mute"}`}
                numberOfLines={2}
              >
                {item.lastMessage.text}
              </Text>
            );
          })()
        ) : (
          <Text
            className="text-sm mt-1 italic text-text-dim"
            numberOfLines={1}
          >
            Нет сообщений
          </Text>
        )}
      </View>
      {hasUnread && (
        <View
          style={{
            minWidth: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: colors.danger ?? "#dc2626",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 6,
            marginLeft: 8,
          }}
        >
          <Text style={{ color: colors.white, fontSize: 11, fontWeight: "700" }}>
            {item.unreadCount > 99 ? "99+" : item.unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
