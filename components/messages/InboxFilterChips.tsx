import { View, Text, Pressable } from "react-native";

export type InboxFilter = "all" | "unread";
export type InboxRoleFilter = "all" | "client" | "specialist";

interface InboxFilterChipsProps {
  filter: InboxFilter;
  roleFilter: InboxRoleFilter;
  isDualRole: boolean;
  onFilterChange: (next: InboxFilter) => void;
  onRoleFilterChange: (next: InboxRoleFilter) => void;
  unreadTotal: number;
  /** Render variant — desktop has its own header above; mobile inlines unread count badge. */
  variant: "desktop" | "mobile";
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`px-3 rounded-full border ${
        active ? "bg-accent border-accent" : "bg-white border-border"
      }`}
      style={{ height: 28, justifyContent: "center" }}
    >
      <Text
        className={`text-xs font-medium ${active ? "text-white" : "text-text-base"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Filter chips row for the unified inbox.
 *
 * Mobile variant: chips + (optional) inline unread badge.
 * Desktop variant: chips only — header & badge live in the parent.
 */
export default function InboxFilterChips({
  filter,
  roleFilter,
  isDualRole,
  onFilterChange,
  onRoleFilterChange,
  unreadTotal,
  variant,
}: InboxFilterChipsProps) {
  const primaryRow = (
    <View className={`flex-row gap-2 ${variant === "mobile" ? "pb-2" : ""}`}>
      <FilterChip
        label="Все"
        active={filter === "all"}
        onPress={() => onFilterChange("all")}
      />
      <FilterChip
        label="Непрочитанные"
        active={filter === "unread"}
        onPress={() => onFilterChange("unread")}
      />
      {variant === "mobile" && unreadTotal > 0 && (
        <View
          className="bg-accent rounded-full items-center justify-center self-center"
          style={{ minWidth: 20, height: 20, paddingHorizontal: 5 }}
        >
          <Text className="text-xs font-bold text-white">
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </Text>
        </View>
      )}
    </View>
  );

  const roleRow = isDualRole ? (
    <View
      className={`flex-row gap-2 ${variant === "mobile" ? "pb-2" : "mt-2"}`}
    >
      <FilterChip
        label="Все"
        active={roleFilter === "all"}
        onPress={() => onRoleFilterChange("all")}
      />
      <FilterChip
        label="Как клиент"
        active={roleFilter === "client"}
        onPress={() => onRoleFilterChange("client")}
      />
      <FilterChip
        label="Как специалист"
        active={roleFilter === "specialist"}
        onPress={() => onRoleFilterChange("specialist")}
      />
    </View>
  ) : null;

  return (
    <>
      {primaryRow}
      {roleRow}
    </>
  );
}
