import { FileText, MessageSquare, Inbox } from "lucide-react-native";
import { DashboardGrid, KpiCard } from "@/components/dashboard";

interface ClientExtraLike {
  activeRequests: number;
  threadsToday: number;
}

interface StatsLike {
  requestsLimit: number;
  unreadMessages: number;
}

interface Props {
  clientExtra: ClientExtraLike | null;
  stats: StatsLike | null;
  activeRequestsCount: number;
  onPressRequests: () => void;
  onPressMessages: () => void;
}

export default function ClientKPIRow({
  clientExtra,
  stats,
  activeRequestsCount,
  onPressRequests,
  onPressMessages,
}: Props) {
  return (
    <DashboardGrid>
      <DashboardGrid.Col span={4} tabletSpan={1}>
        <KpiCard
          label="Активных заявок"
          value={clientExtra?.activeRequests ?? activeRequestsCount}
          hint={`из ${stats?.requestsLimit ?? 5} доступных`}
          icon={FileText}
          tone="primary"
          onPress={onPressRequests}
        />
      </DashboardGrid.Col>
      <DashboardGrid.Col span={4} tabletSpan={1}>
        <KpiCard
          label="Непрочитанных сообщений"
          value={stats?.unreadMessages ?? 0}
          icon={MessageSquare}
          tone={(stats?.unreadMessages ?? 0) > 0 ? "warning" : "muted"}
          onPress={onPressMessages}
        />
      </DashboardGrid.Col>
      <DashboardGrid.Col span={4} tabletSpan={2}>
        <KpiCard
          label="Новых диалогов сегодня"
          value={clientExtra?.threadsToday ?? 0}
          icon={Inbox}
          tone={(clientExtra?.threadsToday ?? 0) > 0 ? "success" : "muted"}
          trend={(clientExtra?.threadsToday ?? 0) > 0 ? "up" : "flat"}
        />
      </DashboardGrid.Col>
    </DashboardGrid>
  );
}
