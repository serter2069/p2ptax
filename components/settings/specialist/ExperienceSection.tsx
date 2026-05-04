import { View, Text } from "react-native";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

interface ExperienceSectionProps {
  /**
   * Free-text long-form description of the specialist's experience.
   * Was a number (yearsOfExperience) but the UX called for a
   * paragraph — clients want to read about background, not see
   * '7 лет' with no context.
   */
  experienceText: string;
  /** Free-text specialization paragraph (replaces the old single-label input). */
  specializationText: string;
  onExperienceTextChange: (v: string) => void;
  onSpecializationTextChange: (v: string) => void;
  onBlur?: () => void;
}

// 200 chars — plenty for one terse paragraph, far short of the
// 2000-char ceiling that made the field look 'too much' (user feedback).
// Backend validation in api/specialist.ts is aligned to the same cap.
const MAX_LEN = 200;

/**
 * Two multiline cards. Each uses numberOfLines (which RN-Web translates
 * to <textarea rows={N}>) so the textarea grows naturally with content,
 * avoiding the runtime resize-loop that AboutSection hit when it tracked
 * heights in JS state. lineCount is purely derived from the string.
 */
function deriveLineCount(text: string, min = 2, max = 6): number {
  const explicit = text.split("\n").length;
  const wrapped = Math.floor(text.length / 60);
  return Math.max(min, Math.min(max, explicit + wrapped));
}

export default function ExperienceSection({
  experienceText,
  specializationText,
  onExperienceTextChange,
  onSpecializationTextChange,
  onBlur,
}: ExperienceSectionProps) {
  return (
    <Card padding="none" className="mb-4" style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
      <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
        Опыт и специализация
      </Text>
      <Text className="text-xs text-text-mute leading-5 mb-4">
        Эти поля показываются на публичном профиле под вашим именем —
        клиенты видят их в первую очередь. Можно писать прозой, абзацами,
        примерами проектов — что считаете нужным.
      </Text>

      <View className="mb-3">
        <Input
          variant="bordered"
          label="Опыт"
          value={experienceText}
          onChangeText={onExperienceTextChange}
          onBlur={onBlur ? () => onBlur() : undefined}
          placeholder="Например: 12 лет в налоговом консалтинге, бывший сотрудник ИФНС, провёл более 200 камеральных и 50 выездных проверок..."
          multiline
          numberOfLines={deriveLineCount(experienceText)}
          maxLength={MAX_LEN}
        />
        <Text className="text-xs text-text-dim text-right mt-1">
          {experienceText.length}/{MAX_LEN}
        </Text>
      </View>

      <View>
        <Input
          variant="bordered"
          label="Специализация"
          value={specializationText}
          onChangeText={onSpecializationTextChange}
          onBlur={onBlur ? () => onBlur() : undefined}
          placeholder="Например: налоговое сопровождение P2P-операций с криптовалютой, защита при камеральных проверках по ст. 88 НК РФ, оспаривание решений ИФНС в УФНС..."
          multiline
          numberOfLines={deriveLineCount(specializationText)}
          maxLength={MAX_LEN}
        />
        <Text className="text-xs text-text-dim text-right mt-1">
          {specializationText.length}/{MAX_LEN}
        </Text>
      </View>
    </Card>
  );
}
