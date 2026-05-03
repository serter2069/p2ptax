import { View } from "react-native";
import { Briefcase, Target } from "lucide-react-native";
import MetricCard from "@/components/ui/MetricCard";
import { spacing } from "@/lib/theme";

interface SpecialistCredentialsProps {
  isTablet: boolean;
  yearsExp: number;
  cities: string[];
  serviceNames: Set<string>;
}

/**
 * 2-up MetricCard grid: Опыт + Специализация. Both columns are derived
 * from data the specialist actually edits in settings (registration date
 * for years; FNS-services list for specialisation). Сертификации column
 * removed — it had no editable counterpart and only ever printed the
 * placeholder "Практикующий консультант".
 */
export default function SpecialistCredentials({
  isTablet,
  yearsExp,
  cities,
  serviceNames,
}: SpecialistCredentialsProps) {
  const services = [...serviceNames];
  return (
    <View className="mt-8">
      <View
        className={`${isTablet ? "flex-row" : "flex-col"}`}
        style={{ gap: spacing.md }}
      >
        <MetricCard
          icon={Briefcase}
          title="Опыт"
          value={`${yearsExp} ${yearsExp === 1 ? "год" : yearsExp < 5 ? "года" : "лет"}`}
          lines={[
            "Налоговая практика",
            cities.length > 0 ? `Регион: ${cities.join(", ")}` : "",
          ].filter(Boolean)}
        />
        <MetricCard
          icon={Target}
          title="Специализация"
          value={services[0] ?? "Налоговая практика"}
          lines={services.slice(1, 4)}
        />
      </View>
    </View>
  );
}
