import {
  Sparkles,
  MessageSquare,
  CalendarDays,
  TrendingUp,
} from "lucide-react-native";
import { DashboardGrid, KpiCard } from "@/components/dashboard";

interface Props {
  matchedToday: number;
  activeThreads: number;
  threadsToday: number;
  threadsLeft: number;
  weekCount: number;
  threadLimitPerDay: number;
}

export default function SpecialistKPIRow({
  matchedToday,
  activeThreads,
  threadsToday,
  threadsLeft,
  weekCount,
  threadLimitPerDay,
}: Props) {
  return (
    <DashboardGrid>
      <DashboardGrid.Col span={3} tabletSpan={1}>
        <KpiCard
          label="Новых совпадений"
          value={matchedToday}
          icon={Sparkles}
          tone="primary"
        />
      </DashboardGrid.Col>
      <DashboardGrid.Col span={3} tabletSpan={1}>
        <KpiCard
          label="Активных диалогов"
          value={activeThreads}
          icon={MessageSquare}
          tone={activeThreads > 0 ? "success" : "muted"}
        />
      </DashboardGrid.Col>
      <DashboardGrid.Col span={3} tabletSpan={1}>
        <KpiCard
          label="Лимит диалогов"
          value={`${threadsToday}/${threadLimitPerDay}`}
          hint={threadsLeft > 0 ? `осталось ${threadsLeft}` : "исчерпан"}
          icon={CalendarDays}
          tone={
            threadsLeft === 0
              ? "danger"
              : threadsLeft <= 3
                ? "warning"
                : "muted"
          }
        />
      </DashboardGrid.Col>
      <DashboardGrid.Col span={3} tabletSpan={1}>
        <KpiCard
          label="Новых за неделю"
          value={weekCount}
          icon={TrendingUp}
          tone={weekCount > 0 ? "success" : "muted"}
          trend={weekCount > 0 ? "up" : "flat"}
        />
      </DashboardGrid.Col>
    </DashboardGrid>
  );
}
