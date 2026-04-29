import { View } from "react-native";
import { Briefcase, Target, ScrollText } from "lucide-react-native";
import MetricCard from "@/components/ui/MetricCard";
import { spacing } from "@/lib/theme";

interface SpecialistCredentialsProps {
  isTablet: boolean;
  yearsExp: number;
  isExFns: boolean;
  cities: string[];
  fnsCodes: string[];
  specializations: string[];
  serviceNames: Set<string>;
  certifications: string[];
}

/**
 * 3-up MetricCard grid: Опыт / Специализация / Сертификации.
 */
export default function SpecialistCredentials({
  isTablet,
  yearsExp,
  isExFns,
  cities,
  fnsCodes,
  specializations,
  serviceNames,
  certifications,
}: SpecialistCredentialsProps) {
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
          lines={
            isExFns
              ? [
                  `Ex-ФНС ${cities[0] ?? ""}`,
                  fnsCodes.length > 0
                    ? `ИФНС ${fnsCodes.slice(0, 2).map((c) => `№${c}`).join(", ")}`
                    : "",
                ].filter(Boolean)
              : [
                  `Налоговая практика`,
                  cities.length > 0 ? `Регион: ${cities.join(", ")}` : "",
                ].filter(Boolean)
          }
        />
        <MetricCard
          icon={Target}
          title="Специализация"
          value={
            specializations.length > 0
              ? specializations[0]
              : [...serviceNames][0] ?? "Налоговая практика"
          }
          lines={
            specializations.length > 0
              ? specializations.slice(1, 4)
              : [...serviceNames].slice(1, 4)
          }
        />
        <MetricCard
          icon={ScrollText}
          title="Сертификации"
          value={
            certifications.length > 0
              ? certifications[0]
              : "Практикующий консультант"
          }
          lines={certifications.slice(1, 4)}
        />
      </View>
    </View>
  );
}
