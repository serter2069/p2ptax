import { View, Text } from "react-native";
import { ClipboardList } from "lucide-react-native";
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
}

export default function MyRequestsWidget({
  clientFeedItems,
  activeRequests,
  onAllRequests,
}: Props) {
  return (
    <DashboardWidget
      title="Мои заявки"
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
      <FeedList
        items={clientFeedItems}
        limit={6}
        emptyText="У вас пока нет заявок. Создайте первую."
      />
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
