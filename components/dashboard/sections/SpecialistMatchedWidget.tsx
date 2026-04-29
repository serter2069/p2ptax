import { Inbox } from "lucide-react-native";
import { DashboardWidget, FeedList, type FeedItem } from "@/components/dashboard";

interface Props {
  specialistFeedItems: FeedItem[];
  matchedCount: number;
  onAllPublic: () => void;
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
      <FeedList
        items={specialistFeedItems}
        limit={6}
        emptyText="Подходящих заявок пока нет. Расширьте рабочую область."
      />
    </DashboardWidget>
  );
}
