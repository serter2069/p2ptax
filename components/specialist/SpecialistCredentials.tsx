import { View, Text } from "react-native";
import { Briefcase, Target, type LucideIcon } from "lucide-react-native";
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

  // Compose prose for the cards. Prefer the specialist's own text;
  // fall back to a single composed sentence so the layout stays
  // consistent (always 'Опыт' + 'Специализация' as headers, body
  // is one paragraph). The legacy MetricCard headline+bullets
  // layout was confusing — title looked like 'Опыт' and value
  // like '15 лет', so users read the value as the heading.
  const yearWord = yearsExp === 1 ? "год" : yearsExp < 5 ? "года" : "лет";
  // Russian prepositional case is messy ('в Москве' / 'в Санкт-Петербурге'
  // / 'в Уфе') — auto-conjugating from a nominative table is a rabbit
  // hole. Sidestep it: 'регион: <Город>' (nominative). Reads natural
  // and avoids 'в Уфа' style ungrammatical fallbacks.
  const expFallback = [
    `${yearsExp} ${yearWord} налоговой практики`,
    cities.length > 0 ? `Регион: ${cities.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const specFallback = services.length > 0 ? services.join(", ") : "Налоговая практика";

  const expProse = experienceText?.trim() || expFallback;
  const specProse = specializationText?.trim() || specFallback;

  return (
    <View className="mt-8">
      <View
        className={`${isTablet ? "flex-row" : "flex-col"}`}
        style={{ gap: spacing.md }}
      >
        <ProseCard icon={Briefcase} title="Опыт" text={expProse} />
        <ProseCard icon={Target} title="Специализация" text={specProse} />
      </View>
    </View>
  );
}
