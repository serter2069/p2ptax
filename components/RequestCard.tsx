import { View, Text, Pressable } from "react-native";
import { Paperclip } from "lucide-react-native";
import { colors } from "@/lib/theme";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}м назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}ч назад`;
  const days = Math.floor(hrs / 24);
  return `${days}д назад`;
}

interface RequestCardProps {
  id: string;
  title: string;
  description: string;
  status?: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
  fns: { id: string; name: string; code: string };
  createdAt: string;
  hasFiles?: boolean;
  filesCount?: number;
  user?: { firstName: string | null; lastName: string | null };
  onPress: (id: string) => void;
}

export default function RequestCard({
  id,
  title,
  description,
  status,
  fns,
  createdAt,
  hasFiles,
  filesCount,
  user,
  onPress,
}: RequestCardProps) {
  const authorName = user
    ? [user.firstName, user.lastName ? user.lastName[0] + "." : null]
        .filter(Boolean)
        .join(" ")
    : null;

  const shortDesc =
    description.length > 120 ? description.slice(0, 120) + "…" : description;

  const isClosed = status === "CLOSED";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => onPress(id)}
      className="bg-white border border-border rounded-2xl p-4 mb-3"
      style={({ pressed }) => [
        {
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isClosed ? 0.03 : 0.06,
          shadowRadius: 4,
          elevation: isClosed ? 1 : 2,
          opacity: isClosed ? 0.6 : 1,
        },
        pressed && { opacity: 0.5, transform: [{ scale: 0.98 }] },
      ]}
    >
      {/* Status badge (closed only) */}
      {isClosed && (
        <View
          className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-gray-200"
          style={{ zIndex: 1 }}
        >
          <Text className="text-xs text-gray-600 font-medium">Закрыт</Text>
        </View>
      )}

      {/* top row: author + time */}
      <View className="flex-row items-center justify-between mb-1" style={{ paddingRight: isClosed ? 60 : 0 }}>
        {authorName ? (
          <Text className="text-xs font-medium text-text-mute">{authorName}</Text>
        ) : (
          <View />
        )}
        <Text className="text-xs text-text-mute">{timeAgo(createdAt)}</Text>
      </View>

      {/* title */}
      <Text
        className="text-base font-semibold text-text-base mb-1"
        numberOfLines={2}
        style={{ flexShrink: 1, minWidth: 0 }}
      >
        {title}
      </Text>

      {/* description */}
      <Text className="text-sm text-text-mute mb-2" numberOfLines={3}>
        {shortDesc}
      </Text>

      {/* bottom row: FNS chip + files */}
      <View className="flex-row items-center justify-between">
        <View className="bg-surface2 px-2 py-0.5 rounded" style={{ maxWidth: "80%" }}>
          <Text className="text-xs text-text-mute" numberOfLines={1}>{fns.name}</Text>
        </View>
        {hasFiles ? (
          <View className="flex-row items-center gap-1">
            <Paperclip size={14} color={colors.textMuted} />
            {filesCount != null && filesCount > 0 ? (
              <Text className="text-xs text-text-mute">{filesCount}</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
