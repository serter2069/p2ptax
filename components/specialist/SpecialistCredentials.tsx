import { View, Text } from "react-native";
import { Briefcase, Target, type LucideIcon } from "lucide-react-native";
import MetricCard from "@/components/ui/MetricCard";
import { colors, spacing } from "@/lib/theme";

interface SpecialistCredentialsProps {
  isTablet: boolean;
  yearsExp: number;
  cities: string[];
  serviceNames: Set<string>;
  /** Long-form free-text Опыт (200 chars max), edited from settings. */
  experienceText?: string | null;
  /** Long-form free-text Специализация (200 chars max), edited from settings. */
  specializationText?: string | null;
}

/**
 * 2-up grid: Опыт + Специализация. When the specialist filled in the
 * free-text fields (experienceText / specializationText), the card
 * shows the title + their paragraph as plain prose — no headline
 * split, no bullets, no auto-derived fallbacks. When the field is
 * empty, falls back to the legacy MetricCard layout with derived
 * defaults so older profiles still show something instead of a void.
 */
function ProseCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <View
      className="bg-white rounded-2xl border border-border p-4 flex-1"
      style={{
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
        minHeight: 180,
      }}
    >
      <View
        className="items-center justify-center rounded-xl mb-3"
        style={{ width: 40, height: 40, backgroundColor: colors.accentSoft }}
      >
        <Icon size={20} color={colors.primary} />
      </View>
      <Text
        className="uppercase mb-2"
        style={{
          fontSize: 12,
          letterSpacing: 2,
          color: colors.textSecondary,
          fontWeight: "600",
        }}
      >
        {title}
      </Text>
      <Text
        className="text-sm leading-6"
        style={{ color: colors.text }}
      >
        {text}
      </Text>
    </View>
  );
}

export default function SpecialistCredentials({
  isTablet,
  yearsExp,
  cities,
  serviceNames,
  experienceText,
  specializationText,
}: SpecialistCredentialsProps) {
  const services = [...serviceNames];
  const expProse = experienceText?.trim() ?? "";
  const specProse = specializationText?.trim() ?? "";

  return (
    <View className="mt-8">
      <View
        className={`${isTablet ? "flex-row" : "flex-col"}`}
        style={{ gap: spacing.md }}
      >
        {expProse ? (
          <ProseCard icon={Briefcase} title="Опыт" text={expProse} />
        ) : (
          <MetricCard
            icon={Briefcase}
            title="Опыт"
            value={`${yearsExp} ${yearsExp === 1 ? "год" : yearsExp < 5 ? "года" : "лет"}`}
            lines={[
              "Налоговая практика",
              cities.length > 0 ? `Регион: ${cities.join(", ")}` : "",
            ].filter(Boolean)}
          />
        )}
        {specProse ? (
          <ProseCard icon={Target} title="Специализация" text={specProse} />
        ) : (
          <MetricCard
            icon={Target}
            title="Специализация"
            value={services[0] ?? "Налоговая практика"}
            lines={services.slice(1, 4)}
          />
        )}
      </View>
    </View>
  );
}
