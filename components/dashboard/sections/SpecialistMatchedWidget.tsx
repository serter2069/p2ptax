import { View, Text, Pressable } from "react-native";
import { Inbox, Search } from "lucide-react-native";
import { DashboardWidget, FeedList, type FeedItem } from "@/components/dashboard";
import { colors } from "@/lib/theme";

interface Props {
  specialistFeedItems: FeedItem[];
  matchedCount: number;
  onAllPublic: () => void;
}

function MatchedEmptyState({ onAllPublic }: { onAllPublic: () => void }) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 24,
        alignItems: "center",
        gap: 12,
      }}
    >
      <Text
        style={{ fontSize: 14, color: colors.textMuted, textAlign: "center" }}
      >
        Нет активных переписок
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Найти специалиста"
        onPress={onAllPublic}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingVertical: 10,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        })}
      >
        <Search size={15} color={colors.primary} />
        <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>
          Найти специалиста
        </Text>
      </Pressable>
    </View>
  );
}

export default function SpecialistMatchedWidget({
  specialistFeedItems,
  matchedCount,
  onAllPublic,
}: Props) {
  return (
    <DashboardWidget
      title="Подходящие публичные заявки"
      subtitle={`Всего ${matchedCount}`}
      icon={Inbox}
      actionLabel="Все →"
      onActionPress={onAllPublic}
      flush
    >
      {specialistFeedItems.length === 0 ? (
        <MatchedEmptyState onAllPublic={onAllPublic} />
      ) : (
        <FeedList items={specialistFeedItems} limit={6} />
      )}
    </DashboardWidget>
  );
}
