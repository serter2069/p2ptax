import { View, Text, Pressable, Image } from "react-native";
import StatusBadge from "./StatusBadge";
import { colors, AVATAR_COLORS } from "@/lib/theme";
import { pluralizeRu } from "@/lib/ru";
import { Paperclip } from "lucide-react-native";

interface UserInfo {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  memberSince: number;
}

interface RequestCardProps {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
  threadsCount: number;
  hasFiles?: boolean;
  user?: UserInfo;
  createdAt?: string;
  onPress: (id: string) => void;
}

function getInitials(firstName: string, lastName: string): string {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatRelative(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 60) return "только что";
  if (diffH < 24) return `${diffH} ${pluralizeRu(diffH, ["час", "часа", "часов"])} назад`;
  if (diffD < 7) return `${diffD} ${pluralizeRu(diffD, ["день", "дня", "дней"])} назад`;
  return new Date(isoDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function RequestCard({
  id,
  title,
  description,
  status,
  city,
  fns,
  threadsCount,
  hasFiles,
  user,
  createdAt,
  onPress,
}: RequestCardProps) {
  const initials = user ? getInitials(user.firstName, user.lastName) : "?";
  const avatarBg = user ? getAvatarColor(user.firstName + user.lastName) : colors.primary;
  const displayName = user
    ? `${user.firstName}${user.lastName ? " " + user.lastName[0] + "." : ""}`
    : null;
  const snippet = description ? description.slice(0, 100) + (description.length > 100 ? "…" : "") : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => onPress(id)}
      className="bg-white border border-border rounded-xl p-4 mb-3"
      style={({ pressed }) => [
        { shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
        pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
      ]}
    >
      {/* Header row: avatar + name + date + status */}
      <View className="flex-row items-center mb-2" style={{ gap: 8 }}>
        {/* Avatar */}
        {user?.avatarUrl ? (
          <Image
            source={{ uri: user.avatarUrl }}
            className="rounded-full"
            style={{ width: 32, height: 32, flexShrink: 0 }}
            accessibilityLabel={displayName ?? "Аватар"}
          />
        ) : (
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 32, height: 32, backgroundColor: avatarBg, flexShrink: 0 }}
          >
            <Text className="text-xs font-semibold text-white">{initials}</Text>
          </View>
        )}

        {/* Name + member since */}
        <View className="flex-1 min-w-0">
          {displayName && (
            <Text className="text-xs font-medium text-text-base" numberOfLines={1}>
              {displayName}
              {user?.memberSince ? (
                <Text className="text-xs font-normal" style={{ color: colors.textMuted }}>
                  {"  ·  На сайте с " + user.memberSince}
                </Text>
              ) : null}
            </Text>
          )}
        </View>

        {/* Date + attachment icon */}
        <View className="flex-row items-center" style={{ gap: 4, flexShrink: 0 }}>
          {hasFiles && <Paperclip size={13} color={colors.textMuted} />}
          {createdAt && (
            <Text className="text-xs" style={{ color: colors.textMuted }}>
              {formatRelative(createdAt)}
            </Text>
          )}
        </View>
      </View>

      {/* Title + status */}
      <View className="flex-row items-center justify-between mb-2">
        <Text
          className="text-lg font-semibold text-text-base flex-1 mr-2"
          numberOfLines={2}
          style={{ flexShrink: 1, minWidth: 0 }}
        >
          {title}
        </Text>
        <StatusBadge status={status} />
      </View>

      {/* City + FNS chips */}
      <View className="flex-row flex-wrap gap-1.5 mb-2">
        <View className="bg-surface2 px-2 py-0.5 rounded">
          <Text className="text-xs text-text-mute">{city.name}</Text>
        </View>
        <View className="bg-surface2 px-2 py-0.5 rounded">
          <Text className="text-xs text-text-mute">{fns.name}</Text>
        </View>
      </View>

      {/* Description snippet */}
      {snippet && (
        <Text className="text-sm text-text-mute mb-2" numberOfLines={2}>
          {snippet}
        </Text>
      )}

      {/* Threads count */}
      <Text className="text-xs text-text-mute">
        {threadsCount === 0
          ? "Никто пока не откликнулся"
          : `${threadsCount} ${pluralizeRu(threadsCount, [
              "специалист",
              "специалиста",
              "специалистов",
            ])} уже ${pluralizeRu(threadsCount, [
              "написал",
              "написали",
              "написали",
            ])}`}
      </Text>
    </Pressable>
  );
}
