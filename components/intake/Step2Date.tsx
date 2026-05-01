import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Check } from "lucide-react-native";
import Input from "@/components/ui/Input";
import { colors } from "@/lib/theme";
import {
  computeDeadline,
  daysUntil,
  formatDateRu,
  parseDateRu,
  DOCUMENT_TYPE_DATE_PROMPT,
  type DocumentType,
} from "./types";

interface Step2Props {
  documentType: DocumentType | null;
  /** ISO yyyy-mm-dd. Empty string means user hasn't entered a date yet. */
  incidentDate: string;
  urgency: boolean;
  onChangeIncidentDate: (iso: string) => void;
  onChangeUrgency: (urgent: boolean) => void;
}

/**
 * Step 2 — text-input date entry (dd.mm.yyyy) + auto-deadline + urgency
 * checkbox. We deliberately don't pull in `react-native-modal-datetime-picker`
 * — the dep isn't installed, web behavior is awkward, and a typed date
 * gives keyboard-fast users a clean path. Native `<input type="date">` is
 * used on web for the picker affordance via `Input` won't help, so we keep
 * the text input universal and rely on the live preview below.
 */
export default function Step2Date({
  documentType,
  incidentDate,
  urgency,
  onChangeIncidentDate,
  onChangeUrgency,
}: Step2Props) {
  const [text, setText] = useState(formatDateRu(incidentDate));

  const deadline = useMemo(
    () => computeDeadline(documentType, incidentDate),
    [documentType, incidentDate]
  );
  const remaining = daysUntil(deadline);

  // Auto-check "urgency" if deadline is <3 days away. User can still uncheck.
  useEffect(() => {
    if (remaining !== null && remaining < 3 && remaining >= 0 && !urgency) {
      onChangeUrgency(true);
    }
  }, [remaining, urgency, onChangeUrgency]);

  const dateError =
    text.length > 0 && parseDateRu(text) === ""
      ? "Введите дату в формате ДД.ММ.ГГГГ"
      : undefined;

  // Pick deadline-line color: green >7, yellow 3-7, red <3 (incl. negative).
  const deadlineColor = (() => {
    if (remaining === null) return colors.text;
    if (remaining < 3) return colors.danger;
    if (remaining <= 7) return colors.warning;
    return colors.success;
  })();

  const prompt = documentType
    ? DOCUMENT_TYPE_DATE_PROMPT[documentType]
    : "Когда произошло событие?";

  const showDeadline = !!documentType && documentType !== "VYEZDNAYA" && documentType !== "OTHER";
  const showVisitNote = documentType === "VYEZDNAYA";

  return (
    <View>
      <Text className="text-2xl font-bold text-text-base mb-2">
        Когда?
      </Text>
      <Text className="text-sm text-text-mute mb-6 leading-5">
        {prompt}
      </Text>

      <View className="mb-4">
        <Text className="text-sm font-medium text-text-base mb-1.5">
          Дата <Text className="text-danger">*</Text>
        </Text>
        <Input
          variant="bordered"
          placeholder="ДД.ММ.ГГГГ"
          value={text}
          onChangeText={(v) => {
            setText(v);
            const iso = parseDateRu(v);
            onChangeIncidentDate(iso);
          }}
          error={dateError}
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

      {showDeadline && deadline && remaining !== null && (
        <View
          className="rounded-xl p-4 mb-4"
          style={{
            backgroundColor:
              remaining < 3
                ? colors.dangerSoft
                : remaining <= 7
                  ? colors.warningTintBg
                  : colors.successSoft,
            borderWidth: 1,
            borderColor: deadlineColor,
          }}
        >
          <Text
            className="text-sm font-semibold mb-0.5"
            style={{ color: deadlineColor }}
          >
            {remaining < 0
              ? `Дедлайн прошёл ${Math.abs(remaining)} дн. назад`
              : remaining === 0
                ? "Дедлайн сегодня"
                : `До дедлайна ${remaining} дн.`}
          </Text>
          <Text className="text-xs" style={{ color: deadlineColor }}>
            Дата: {formatDateRu(deadline)}
            {documentType === "TREBOVANIE" &&
              " · 10 рабочих дней с даты получения требования"}
            {documentType === "RESHENIE" &&
              " · 30 дней на возражения"}
          </Text>
        </View>
      )}

      {showVisitNote && incidentDate && (
        <View
          className="rounded-xl p-4 mb-4"
          style={{
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.primary,
          }}
        >
          <Text
            className="text-sm font-semibold mb-0.5"
            style={{ color: colors.primary }}
          >
            Визит назначен на {formatDateRu(incidentDate)}
          </Text>
          <Text className="text-xs" style={{ color: colors.primary }}>
            Подготовка к выездной — обсудим со специалистом по вашему ФНС.
          </Text>
        </View>
      )}

      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel="Срочно"
        accessibilityState={{ checked: urgency }}
        onPress={() => onChangeUrgency(!urgency)}
        className="flex-row items-start py-2"
        style={{ minHeight: 44 }}
      >
        <View
          className="rounded-md items-center justify-center mr-3"
          style={{
            width: 22,
            height: 22,
            marginTop: 2,
            borderWidth: 2,
            borderColor: urgency ? colors.danger : colors.borderStrong,
            backgroundColor: urgency ? colors.danger : "transparent",
          }}
        >
          {urgency && <Check size={14} color={colors.white} strokeWidth={3} />}
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-text-base">
            Срочно — дедлайн уже через несколько дней
          </Text>
          <Text className="text-xs text-text-mute mt-0.5 leading-4">
            Специалистам уйдёт пометка о срочности — отвечают приоритетно.
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

