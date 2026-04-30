import { View, Text, Pressable } from "react-native";
import { ClipboardList, Plus } from "lucide-react-native";
import { DashboardWidget, FeedList, type FeedItem } from "@/components/dashboard";
import StatusBadge from "@/components/StatusBadge";
import { colors } from "@/lib/theme";

interface ActiveRequestLike {
  id: string;
  status: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
}

interface Props {
  clientFeedItems: FeedItem[];
  activeRequests: ActiveRequestLike[];
  onAllRequests: () => void;
  onCreateRequest: () => void;
}

function RequestsEmptyState({ onCreateRequest }: { onCreateRequest: () => void }) {
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
        У вас нет активных запросов
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Создать запрос"
        onPress={onCreateRequest}
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
        <Plus size={15} color={colors.primary} />
        <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>
          Создать запрос
        </Text>
      </Pressable>
    </View>
  );
}

export default function MyRequestsWidget({
  clientFeedItems,
  activeRequests,
  onAllRequests,
  onCreateRequest,
}: Props) {
  return (
    <DashboardWidget
      title="Мои запросы"
      subtitle={
        clientFeedItems.length > 0
          ? `Всего ${clientFeedItems.length}`
          : "Пусто"
      }
      icon={ClipboardList}
      actionLabel="Все →"
      onActionPress={onAllRequests}
      flush
    >
      {clientFeedItems.length === 0 ? (
        <RequestsEmptyState onCreateRequest={onCreateRequest} />
      ) : (
        <FeedList items={clientFeedItems} limit={6} />
      )}
      {activeRequests.length > 0 ? (
        <View
          className="flex-row flex-wrap items-center gap-2"
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {activeRequests.slice(0, 3).map((r) => (
            <StatusBadge key={r.id} status={r.status} />
          ))}
          <Text className="text-text-dim" style={{ fontSize: 12 }}>
            {activeRequests.length} активных
          </Text>
        </View>
      ) : null}
    </DashboardWidget>
  );
}
