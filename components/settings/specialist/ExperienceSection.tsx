import { View, Text } from "react-native";
import Input from "@/components/ui/Input";

interface ExperienceSectionProps {
  /** Stored as a number on SpecialistProfile.yearsOfExperience; null = not set. */
  yearsOfExperience: number | null;
  /** Single primary service-line label. Persisted as JSON string[] of length 1. */
  specialization: string;
  onYearsOfExperienceChange: (v: number | null) => void;
  onSpecializationChange: (v: string) => void;
  /** Fires on input blur — used by the merged Profile page autosave. */
  onBlur?: () => void;
}

/**
 * ExperienceSection — editable counterparts to the values rendered on
 * the public profile detail page (SpecialistCredentials shows
 * 'Стаж: N лет', SpecialistHero shows the primary service line as
 * 'Специализация'). Without this section the public profile rendered
 * data the specialist couldn't change.
 *
 * Years are kept as a free integer input (0–80, validated server-side).
 * Empty string clears the field — backend stores null.
 */
export default function ExperienceSection({
  yearsOfExperience,
  specialization,
  onYearsOfExperienceChange,
  onSpecializationChange,
  onBlur,
}: ExperienceSectionProps) {
  return (
    <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
      <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
        Опыт и специализация
      </Text>
      <Text className="text-xs text-text-mute leading-5 mb-3">
        Эти поля показываются на публичном профиле под вашим именем — клиенты
        видят их в первую очередь.
      </Text>
      <View className="mb-3">
        <Input
          variant="bordered"
          label="Стаж работы (лет)"
          value={yearsOfExperience !== null ? String(yearsOfExperience) : ""}
          onChangeText={(v) => {
            const trimmed = v.trim();
            if (trimmed === "") {
              onYearsOfExperienceChange(null);
              return;
            }
            const n = parseInt(trimmed.replace(/[^0-9]/g, ""), 10);
            if (Number.isFinite(n) && n >= 0 && n <= 80) {
              onYearsOfExperienceChange(n);
            }
          }}
          onBlur={onBlur ? () => onBlur() : undefined}
          placeholder="Например, 7"
          keyboardType="numeric"
          maxLength={2}
        />
      </View>
      <Input
        variant="bordered"
        label="Специализация"
        value={specialization}
        onChangeText={onSpecializationChange}
        onBlur={onBlur ? () => onBlur() : undefined}
        placeholder="Например, Налоговый консалтинг"
        maxLength={80}
      />
    </View>
  );
}
